/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * This was created because the helper methods in {@link java.util.concurrent.Executors} do not work
 * as people would normally expect.
 *
 * <p>Normally, you would think that a cached thread pool would create new threads when necessary,
 * queue them when the pool is full, and kill threads when they've been inactive for a certain
 * period of time. This is not how {@link java.util.concurrent.Executors#newCachedThreadPool()}
 * works.
 *
 * <p>Instead, {@link java.util.concurrent.Executors#newCachedThreadPool()} executes all tasks on a
 * new or cached thread immediately because corePoolSize is 0, SynchronousQueue is a queue with size
 * 0 and maxPoolSize is Integer.MAX_VALUE. This is dangerous because it can create an unchecked
 * amount of threads.
 */
/* package */
final class AndroidExecutors {

  private static final AndroidExecutors INSTANCE = new AndroidExecutors();

  @NonNull private final Executor uiThread;
  @NonNull private final Executor uiThreadConditionalSync;

  private AndroidExecutors() {
    uiThread = new UIThreadExecutor();
    uiThreadConditionalSync = new UIThreadConditionalSyncExecutor();
  }

  /**
   * Nexus 5: Quad-Core Moto X: Dual-Core
   *
   * <p>AsyncTask: CORE_POOL_SIZE = CPU_COUNT + 1 MAX_POOL_SIZE = CPU_COUNT * 2 + 1
   *
   * <p>https://github.com/android/platform_frameworks_base/commit/719c44e03b97e850a46136ba336d729f5fbd1f47
   */
  private static final int CPU_COUNT = Runtime.getRuntime().availableProcessors();

  /* package */ static final int CORE_POOL_SIZE = CPU_COUNT + 1;
  /* package */ static final int MAX_POOL_SIZE = CPU_COUNT * 2 + 1;
  /* package */ static final long KEEP_ALIVE_TIME = 1L;

  /**
   * Creates a proper Cached Thread Pool. Tasks will reuse cached threads if available or create new
   * threads until the core pool is full. tasks will then be queued. If an task cannot be queued, a
   * new thread will be created unless this would exceed max pool size, then the task will be
   * rejected. Threads will time out after 1 second.
   *
   * <p>Core thread timeout is only available on android-9+.
   *
   * @return the newly created thread pool
   */
  public static @NonNull ExecutorService newCachedThreadPool() {
    ThreadPoolExecutor executor =
        new ThreadPoolExecutor(
            CORE_POOL_SIZE,
            MAX_POOL_SIZE,
            KEEP_ALIVE_TIME,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<Runnable>());

    executor.allowCoreThreadTimeOut(true);

    return executor;
  }

  /**
   * Creates a proper Cached Thread Pool. Tasks will reuse cached threads if available or create new
   * threads until the core pool is full. tasks will then be queued. If an task cannot be queued, a
   * new thread will be created unless this would exceed max pool size, then the task will be
   * rejected. Threads will time out after 1 second.
   *
   * <p>Core thread timeout is only available on android-9+.
   *
   * @param threadFactory the factory to use when creating new threads
   * @return the newly created thread pool
   */
  public static @NonNull ExecutorService newCachedThreadPool(@NonNull ThreadFactory threadFactory) {
    ThreadPoolExecutor executor =
        new ThreadPoolExecutor(
            CORE_POOL_SIZE,
            MAX_POOL_SIZE,
            KEEP_ALIVE_TIME,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<Runnable>(),
            threadFactory);

    executor.allowCoreThreadTimeOut(true);

    return executor;
  }

  /**
   * An {@link java.util.concurrent.Executor} that schedules tasks to run asynchronously on the UI
   * thread.
   */
  public static @NonNull Executor uiThread() {
    return INSTANCE.uiThread;
  }

  /**
   * An {@link java.util.concurrent.Executor} that runs tasks on the UI thread (immediately if
   * already on that thread).
   */
  public static @NonNull Executor uiThreadConditionalSync() {
    return INSTANCE.uiThreadConditionalSync;
  }

  /**
   * An {@link java.util.concurrent.Executor} that schedules tasks to run asynchronously on the UI
   * thread.
   */
  private static class UIThreadExecutor implements Executor {
    private final Handler mHandler = new Handler(Looper.getMainLooper());

    @Override
    public void execute(@NonNull Runnable command) {
      // Otherwise, post it on the main thread handler
      mHandler.post(command);
    }
  }

  /**
   * An {@link java.util.concurrent.Executor} that runs tasks on the UI thread (immediately if
   * already on that thread).
   */
  private static class UIThreadConditionalSyncExecutor implements Executor {
    private final Handler mHandler = new Handler(Looper.getMainLooper());

    @Override
    public void execute(@NonNull Runnable command) {
      if (Looper.myLooper() == mHandler.getLooper()) {
        // If we're already on the main thread, execute the command immediately
        command.run();
      } else {
        // Otherwise, post it on the main thread handler
        mHandler.post(command);
      }
    }
  }
}
