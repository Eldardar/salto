/*
*                      Copyright 2021 Salto Labs Ltd.
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
import { InstanceElement, ElemID, ObjectType } from '@salto-io/adapter-api'
import { adapter } from '../src/adapter_creator'
import { Credentials } from '../src/auth'
import { JiraConfig } from '../src/config'


export const createCredentialsInstance = (credentials: Credentials): InstanceElement => (
  new InstanceElement(
    ElemID.CONFIG_NAME,
    adapter.authenticationMethods.basic.credentialsType,
    credentials,
  )
)

export const createConfigInstance = (config: JiraConfig): InstanceElement => (
  new InstanceElement(
    ElemID.CONFIG_NAME,
    adapter.configType as ObjectType,
    config,
  )
)
