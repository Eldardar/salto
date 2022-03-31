/*
*                      Copyright 2022 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import { getChangeData, InstanceElement, isAdditionOrModificationChange, isInstanceChange, isInstanceElement, isRemovalChange } from '@salto-io/adapter-api'
import { logger } from '@salto-io/logging'
import { getParents, safeJsonStringify } from '@salto-io/adapter-utils'
import { client as clientUtils } from '@salto-io/adapter-components'
import _ from 'lodash'
import { values } from '@salto-io/lowerdash'
import { FilterCreator } from '../../filter'
import { DASHBOARD_GADGET_TYPE } from '../../constants'
import JiraClient from '../../client/client'
import { defaultDeployChange, deployChanges } from '../../deployment/standard_deployment'
import { findObject, setFieldDeploymentAnnotations } from '../../utils'

const log = logger(module)

const deployGadgetProperties = async (
  instance: InstanceElement,
  client: JiraClient
): Promise<void> => {
  const dashboardId = getParents(instance)[0].value.value.id

  await Promise.all(
    Object.entries(instance.value.properties ?? {})
      .map(([key, value]) =>
        client.put({
          url: `/rest/api/3/dashboard/${dashboardId}/items/${instance.value.id}/properties/${key}`,
          data: value,
          headers: {
            // value can be a string and in that case axios won't send
            // this header so we need to add it
            'Content-Type': 'application/json',
          },
        }))
  )
}

const getPropertiesKeys = async (
  instance: InstanceElement,
  client: JiraClient,
): Promise<string[]> => {
  const dashboardId = getParents(instance)[0].value.value.id

  const response = await client.getSinglePage({
    url: `/rest/api/3/dashboard/${dashboardId}/items/${instance.value.id}/properties`,
  })
  if (Array.isArray(response.data) || !Array.isArray(response.data.keys)) {
    log.error(`Invalid response from server when fetching property keys for ${instance.elemID.getFullName()}: ${safeJsonStringify(response.data)}`)
    return []
  }

  return response.data.keys.map(key => key.key).filter(key => !_.isEmpty(key))
}

const getPropertyValue = async (
  instance: InstanceElement,
  key: string,
  client: JiraClient,
): Promise<unknown> => {
  const dashboardId = getParents(instance)[0].value.value.id

  const response = await client.getSinglePage({
    url: `/rest/api/3/dashboard/${dashboardId}/items/${instance.value.id}/properties/${key}`,
  })
  if (Array.isArray(response.data)) {
    log.error(`Invalid response from server when fetching property '${key}' value for ${instance.elemID.getFullName()}: ${safeJsonStringify(response.data)}`)
    return undefined
  }

  return response.data.value
}

const filter: FilterCreator = ({ client, config }) => ({
  onFetch: async elements => {
    await Promise.all(elements
      .filter(isInstanceElement)
      .filter(instance => instance.elemID.typeName === DASHBOARD_GADGET_TYPE)
      .map(async instance => {
        const keys = await getPropertiesKeys(instance, client)
        instance.value.properties = _.pickBy(Object.fromEntries(
          await Promise.all(keys.map(async key => [
            key,
            await getPropertyValue(instance, key, client),
          ]))
        ), values.isDefined)
      }))

    const gadgetType = findObject(elements, DASHBOARD_GADGET_TYPE)
    if (gadgetType === undefined) {
      log.warn(`${DASHBOARD_GADGET_TYPE} type not found`)
      return
    }
    setFieldDeploymentAnnotations(gadgetType, 'properties')
  },

  deploy: async changes => {
    const [relevantChanges, leftoverChanges] = _.partition(
      changes,
      change => isInstanceChange(change)
        && getChangeData(change).elemID.typeName === DASHBOARD_GADGET_TYPE
    )


    const deployResult = await deployChanges(
      relevantChanges
        .filter(isInstanceChange),
      async change => {
        try {
          await defaultDeployChange({
            change,
            client,
            apiDefinitions: config.apiDefinitions,
            fieldsToIgnore: [
              'properties',
            ],
          })
        } catch (err) {
          if (err instanceof clientUtils.HTTPError
            && err.response.status === 404
            && isRemovalChange(change)) {
            return
          }
          throw err
        }

        if (isAdditionOrModificationChange(change)) {
          await deployGadgetProperties(getChangeData(change), client)
        }
      }
    )

    return {
      leftoverChanges,
      deployResult,
    }
  },
})

export default filter