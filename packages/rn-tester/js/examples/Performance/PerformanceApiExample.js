/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @oncall react_native
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type MemoryInfo from 'react-native/src/private/webapis/performance/MemoryInfo';
import type ReactNativeStartupTiming from 'react-native/src/private/webapis/performance/ReactNativeStartupTiming';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {useContext, useEffect} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import Performance from 'react-native/src/private/webapis/performance/Performance';
import {
  type PerformanceEntry,
  type PerformanceEventTiming,
  PerformanceObserver,
} from 'react-native/src/private/webapis/performance/PerformanceObserver';

const {useState, useCallback} = React;
const performance = new Performance();

function MemoryExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

  // Memory API testing
  const [memoryInfo, setMemoryInfo] = useState<?MemoryInfo>(null);
  const onGetMemoryInfo = useCallback(() => {
    // performance.memory is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    setMemoryInfo(performance.memory);
  }, []);
  return (
    <View style={styles.container}>
      <Button onPress={onGetMemoryInfo} title="Click to update memory info" />
      <View>
        <Text style={{color: theme.LabelColor}}>
          {`jsHeapSizeLimit: ${String(memoryInfo?.jsHeapSizeLimit)} bytes`}
        </Text>
        <Text style={{color: theme.LabelColor}}>
          {`totalJSHeapSize: ${String(memoryInfo?.totalJSHeapSize)} bytes`}
        </Text>
        <Text style={{color: theme.LabelColor}}>
          {`usedJSHeapSize: ${String(memoryInfo?.usedJSHeapSize)} bytes`}
        </Text>
      </View>
    </View>
  );
}

function StartupTimingExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

  // React Startup Timing API testing
  const [startUpTiming, setStartUpTiming] =
    useState<?ReactNativeStartupTiming>(null);
  const onGetStartupTiming = useCallback(() => {
    // performance.reactNativeStartupTiming is not included in bom.js yet.
    // Once we release the change in flow this can be removed.
    setStartUpTiming(performance.rnStartupTiming);
  }, []);
  return (
    <View style={styles.container}>
      <Button
        onPress={onGetStartupTiming}
        title="Click to update React startup timing"
      />
      <View>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`startTime: ${String(startUpTiming?.startTime)} ms`}</Text>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`initializeRuntimeStart: ${String(
          startUpTiming?.initializeRuntimeStart,
        )} ms`}</Text>
        <Text style={{color: theme.LabelColor}}>
          {`executeJavaScriptBundleEntryPointStart: ${String(
            startUpTiming?.executeJavaScriptBundleEntryPointStart,
          )} ms`}
        </Text>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`executeJavaScriptBundleEntryPointEnd: ${String(
          startUpTiming?.executeJavaScriptBundleEntryPointEnd,
        )} ms`}</Text>
        <Text
          style={{color: theme.LabelColor}}>{`initializeRuntimeEnd: ${String(
          startUpTiming?.initializeRuntimeEnd,
        )} ms`}</Text>
        <Text
          style={{
            color: theme.LabelColor,
          }}>{`endTime: ${String(startUpTiming?.endTime)} ms`}</Text>
      </View>
    </View>
  );
}

function PerformanceObserverUserTimingExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

  const [entries, setEntries] = useState<$ReadOnlyArray<PerformanceEntry>>([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      setEntries(
        list.getEntries().filter(entry => entry.name.startsWith('rntester-')),
      );
    });

    observer.observe({entryTypes: ['mark', 'measure']});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    performance.mark('rntester-mark1');
    performance.mark('rntester-mark2');
    performance.measure(
      'rntester-measure1',
      'rntester-mark1',
      'rntester-mark2',
    );
  }, []);

  return (
    <View style={styles.container}>
      <Button onPress={onPress} title="Click to log some marks and measures" />
      <View>
        {entries.map((entry, index) =>
          entry.entryType === 'mark' ? (
            <Text style={{color: theme.LabelColor}} key={index}>
              Mark {entry.name}: {entry.startTime.toFixed(2)}
            </Text>
          ) : (
            <Text style={{color: theme.LabelColor}} key={index}>
              Measure {entry.name}: {entry.startTime.toFixed(2)} -{' '}
              {(entry.startTime + entry.duration).toFixed(2)} (
              {entry.duration.toFixed(2)}ms)
            </Text>
          ),
        )}
      </View>
    </View>
  );
}

function PerformanceObserverEventTimingExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

  const [count, setCount] = useState(0);

  const [entries, setEntries] = useState<
    $ReadOnlyArray<PerformanceEventTiming>,
  >([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      const newEntries: $ReadOnlyArray<PerformanceEventTiming> =
        // $FlowExpectedError[incompatible-type] This is guaranteed because we're only observing `event` entry types.
        list.getEntries();
      setEntries(newEntries);
    });

    observer.observe({type: 'event'});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    busyWait(500);
    // Force a state update to show how/if we're reporting paint times as well.
    setCount(currentCount => currentCount + 1);
  }, []);

  return (
    <View style={styles.container}>
      <Button
        onPress={onPress}
        title={`Click to force a slow event (clicked ${count} times)`}
      />
      <View>
        {entries.map((entry, index) => (
          <Text style={{color: theme.LabelColor}} key={index}>
            Event: {entry.name}
            {'\n'}
            Start: {entry.startTime.toFixed(2)}
            {'\n'}
            End: {(entry.startTime + entry.duration).toFixed(2)}
            {'\n'}
            Duration: {entry.duration.toFixed(2)}ms{'\n'}
            Processing start: {entry.processingStart.toFixed(2)} (delay:{' '}
            {(entry.processingStart - entry.startTime).toFixed(2)}ms){'\n'}
            Processing end: {entry.processingEnd.toFixed(2)} (duration:{' '}
            {(entry.processingEnd - entry.processingStart).toFixed(2)}ms){'\n'}
          </Text>
        ))}
      </View>
    </View>
  );
}

function PerformanceObserverLongtaskExample(): React.Node {
  const theme = useContext(RNTesterThemeContext);

  const [entries, setEntries] = useState<$ReadOnlyArray<PerformanceEntry>>([]);

  useEffect(() => {
    const observer = new PerformanceObserver(list => {
      setEntries(list.getEntries());
    });

    observer.observe({entryTypes: ['longtask']});

    return () => observer.disconnect();
  }, []);

  const onPress = useCallback(() => {
    // Wait 1s to force a long task
    busyWait(1000);
  }, []);

  return (
    <View style={styles.container}>
      <Button onPress={onPress} title="Click to force a long task" />
      <View>
        {entries.map((entry, index) => (
          <Text style={{color: theme.LabelColor}} key={index}>
            Long task {entry.name}: {entry.startTime} -{' '}
            {entry.startTime + entry.duration} ({entry.duration}ms)
          </Text>
        ))}
      </View>
    </View>
  );
}

function busyWait(ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {}
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export const title = 'Performance API Examples';
export const category = 'Basic';
export const description = 'Shows the performance API provided in React Native';
export const examples: Array<RNTesterModuleExample> = ([
  {
    title: 'performance.memory',
    render: (): React.Node => {
      return <MemoryExample />;
    },
  },
  {
    title: 'performance.reactNativeStartupTiming',
    render: (): React.Node => {
      return <StartupTimingExample />;
    },
  },
  {
    title: 'PerformanceObserver (marks and measures)',
    render: (): React.Node => {
      return <PerformanceObserverUserTimingExample />;
    },
  },
  {
    title: 'PerformanceObserver (events)',
    render: (): React.Node => {
      return <PerformanceObserverEventTimingExample />;
    },
  },
  PerformanceObserver.supportedEntryTypes.includes('longtask')
    ? {
        title: 'PerformanceObserver (long tasks)',
        render: (): React.Node => {
          return <PerformanceObserverLongtaskExample />;
        },
      }
    : null,
]: Array<?RNTesterModuleExample>).filter(Boolean);
