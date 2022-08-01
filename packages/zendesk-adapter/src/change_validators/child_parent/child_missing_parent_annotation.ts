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
import _ from 'lodash'
import { ChangeValidator, getChangeData, isInstanceChange,
  ChangeError, InstanceElement, ModificationChange, isAdditionOrModificationChange,
  isReferenceExpression, isInstanceElement, AdditionChange, CORE_ANNOTATIONS,
  ReferenceExpression, isAdditionChange } from '@salto-io/adapter-api'
import { ZendeskApiConfig } from '../../config'
import { getChildAndParentTypeNames } from './utils'

export const createChildReferencesError = (
  change: AdditionChange<InstanceElement> | ModificationChange<InstanceElement>,
  childFullName: string,
): ChangeError => {
  const instance = getChangeData(change)
  return {
    elemID: instance.elemID,
    severity: 'Error',
    message: `Can’t add or modify instances of ${instance.elemID.typeName} without updating their related children as well`,
    detailedMessage: `Can’t add or modify ${instance.elemID.getFullName()} without updating ${childFullName} as its child`,
  }
}

const validateChildParentAnnotation = (
  parentChange: AdditionChange<InstanceElement> | ModificationChange<InstanceElement>,
  childRef: ReferenceExpression,
  validChildType: string,
): ChangeError[] => {
  if (!(isReferenceExpression(childRef) && isInstanceElement(childRef.value))) {
    return []
  }
  const parentInstance = getChangeData(parentChange)
  const childInstance = childRef.value
  const childFullName = childInstance.elemID.getFullName()
  if (!(
    childInstance.elemID.typeName === validChildType
    && childInstance.annotations[CORE_ANNOTATIONS.PARENT]?.[0].value.elemID.getFullName()
      === parentInstance.elemID.getFullName()
  )) {
    return [createChildReferencesError(parentChange, childFullName)]
  }
  return []
}

const hasRelevantFieldChanged = (
  change: AdditionChange<InstanceElement> | ModificationChange<InstanceElement>,
  fieldName: string,
): boolean => {
  if (isAdditionChange(change)) {
    return change.data.after.value[fieldName] !== undefined
  }
  return !_.isEqual(change.data.before.value[fieldName], change.data.after.value[fieldName])
}

/**
* Creates an error when a child value being added or modified in the parent (reference expression)
* and the parent annotation in the child instance isn't updated
*/
export const childMissingParentAnnotationValidatorCreator = (
  apiConfig: ZendeskApiConfig,
): ChangeValidator => async changes => {
  const relationships = getChildAndParentTypeNames(apiConfig)
  const parentTypes = new Set(relationships.map(r => r.parent))

  const relevantParentChanges = changes
    .filter(isInstanceChange)
    .filter(isAdditionOrModificationChange)
    .filter(change => parentTypes.has(getChangeData(change).elemID.typeName))

  return relevantParentChanges.flatMap(change => {
    const instance = getChangeData(change)
    const relationship = relationships.find(r => r.parent === instance.elemID.typeName)
    if (relationship === undefined || !hasRelevantFieldChanged(change, relationship.fieldName)) {
      return []
    }
    // Handling with list-type fields as well
    const fieldValue = _.castArray(instance.value[relationship.fieldName])
    return fieldValue.flatMap(childRef => validateChildParentAnnotation(
      change,
      childRef,
      relationship.child
    ))
  })
}