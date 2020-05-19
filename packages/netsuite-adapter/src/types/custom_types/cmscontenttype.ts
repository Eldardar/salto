/*
*                      Copyright 2020 Salto Labs Ltd.
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
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/camelcase */
import {
  BuiltinTypes, CORE_ANNOTATIONS, ElemID, Field, ObjectType,
} from '@salto-io/adapter-api'
import * as constants from '../../constants'

export const cmscontenttypeInnerTypes: ObjectType[] = []

const cmscontenttypeElemID = new ElemID(constants.NETSUITE, 'cmscontenttype')

export const cmscontenttype = new ObjectType({
  elemID: cmscontenttypeElemID,
  annotations: {
    [constants.SCRIPT_ID_PREFIX]: 'custcontenttype_',
  },
  fields: {
    scriptid: new Field(
      cmscontenttypeElemID,
      'scriptid',
      BuiltinTypes.SERVICE_ID,
      {
        [constants.IS_ATTRIBUTE]: true,
      },
    ), /* Original description: This attribute value can be up to 99 characters long.   The default value is ‘custcontenttype’. */
    name: new Field(
      cmscontenttypeElemID,
      'name',
      BuiltinTypes.STRING,
      {
        [CORE_ANNOTATIONS.REQUIRED]: true,
        // [CORE_ANNOTATIONS.LENGTH_LIMIT]: 999,
      },
    ), /* Original description: This field value can be up to 999 characters long. */
    label: new Field(
      cmscontenttypeElemID,
      'label',
      BuiltinTypes.STRING,
      {
        [CORE_ANNOTATIONS.REQUIRED]: true,
        [constants.IS_NAME]: true,
        // [CORE_ANNOTATIONS.LENGTH_LIMIT]: 18,
      },
    ), /* Original description: This field value can be up to 18 characters long. */
    customrecordid: new Field(
      cmscontenttypeElemID,
      'customrecordid',
      BuiltinTypes.STRING /* Original type was single-select list */,
      {
        [CORE_ANNOTATIONS.REQUIRED]: true,
      },
    ), /* Original description: This field accepts references to the customrecordtype custom type. */
    description: new Field(
      cmscontenttypeElemID,
      'description',
      BuiltinTypes.STRING,
      {
        // [CORE_ANNOTATIONS.LENGTH_LIMIT]: 999,
      },
    ), /* Original description: This field value can be up to 999 characters long. */
    iconimagepath: new Field(
      cmscontenttypeElemID,
      'iconimagepath',
      BuiltinTypes.STRING,
      {
        // [CORE_ANNOTATIONS.LENGTH_LIMIT]: 999,
      },
    ), /* Original description: This field value can be up to 999 characters long. */
  },
  path: [constants.NETSUITE, constants.TYPES_PATH, cmscontenttypeElemID.name],
})