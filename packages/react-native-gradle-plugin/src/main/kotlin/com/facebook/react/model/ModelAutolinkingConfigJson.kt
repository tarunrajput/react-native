/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

data class ModelAutolinkingConfigJson(
    val reactNativeVersion: String,
    val dependencies: Map<String, ModelAutolinkingDependenciesJson>?,
    val project: ModelAutolinkingProjectJson?,
)
