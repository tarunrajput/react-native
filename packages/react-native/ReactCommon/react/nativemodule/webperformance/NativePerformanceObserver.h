/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include("rncoreJSI.h") // Cmake headers on Android
#include "rncoreJSI.h"
#elif __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

using NativePerformanceObserverCallback = AsyncCallback<>;
using NativePerformanceObserverObserveOptions =
    NativePerformanceObserverPerformanceObserverInit<
        // entryTypes
        std::optional<std::vector<int>>,
        // type
        std::optional<int>,
        // buffered
        std::optional<bool>,
        // durationThreshold
        std::optional<double>>;

#pragma mark - Structs

template <>
struct Bridging<PerformanceEntryType> {
  static PerformanceEntryType fromJs(
      jsi::Runtime& /*rt*/,
      const jsi::Value& value) {
    return static_cast<PerformanceEntryType>(value.asNumber());
  }

  static jsi::Value toJs(
      jsi::Runtime& /*rt*/,
      const PerformanceEntryType& value) {
    return {static_cast<int>(value)};
  }
};

template <>
struct Bridging<NativePerformanceObserverObserveOptions>
    : NativePerformanceObserverPerformanceObserverInitBridging<
          NativePerformanceObserverObserveOptions> {};

template <>
struct Bridging<PerformanceEntry>
    : NativePerformanceObserverRawPerformanceEntryBridging<PerformanceEntry> {};

#pragma mark - implementation

class NativePerformanceObserver
    : public NativePerformanceObserverCxxSpec<NativePerformanceObserver> {
 public:
  explicit NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Object createObserver(
      jsi::Runtime& rt,
      NativePerformanceObserverCallback callback);
  double getDroppedEntriesCount(jsi::Runtime& rt, jsi::Object observerObj);

  void observe(
      jsi::Runtime& rt,
      jsi::Object observer,
      NativePerformanceObserverObserveOptions options);
  void disconnect(jsi::Runtime& rt, jsi::Object observer);
  std::vector<PerformanceEntry> takeRecords(
      jsi::Runtime& rt,
      jsi::Object observerObj,
      // When called via `observer.takeRecords` it should be in insertion order.
      // When called via the observer callback, it should be in chronological
      // order with respect to `startTime`.
      bool sort);

  std::vector<std::pair<std::string, uint32_t>> getEventCounts(
      jsi::Runtime& rt);

  void clearEntries(
      jsi::Runtime& rt,
      PerformanceEntryType entryType,
      std::optional<std::string> entryName);

  std::vector<PerformanceEntry> getEntries(
      jsi::Runtime& rt,
      std::optional<PerformanceEntryType> entryType,
      std::optional<std::string> entryName);

  std::vector<PerformanceEntryType> getSupportedPerformanceEntryTypes(
      jsi::Runtime& rt);
};

} // namespace facebook::react
