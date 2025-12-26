---
title: 'JVM Architecture & Memory Management: Hiểu về Garbage Collection'
description: 'Khám phá kiến trúc JVM và cách Garbage Collection hoạt động để quản lý bộ nhớ tự động trong Java'
pubDate: 'Dec 25 2025'
heroImage: '../../assets/jvm-architecture-memory-management.png'
category: 'Java Backend'
---

## Lời mở đầu

Một trong những điểm mạnh của Java là **Garbage Collection (GC)** - bộ nhớ được quản lý tự động, developer không cần `malloc/free` như C/C++. Nhưng để tối ưu performance, chúng ta cần hiểu JVM hoạt động như thế nào!

Hôm nay mình sẽ giải thích JVM Architecture và Garbage Collection theo cách đơn giản nhất.

## 🏗️ JVM Architecture Overview

JVM (Java Virtual Machine) có 3 components chính:

```
┌────────────────────────────────────────────────┐
│              JVM Architecture                   │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │        Class Loader Subsystem            │  │
│  │  - Bootstrap ClassLoader                 │  │
│  │  - Extension ClassLoader                 │  │
│  │  │  - Application ClassLoader            │  │
│  └──────────────────────────────────────────┘  │
│                    ▼                            │
│  ┌──────────────────────────────────────────┐  │
│  │         Runtime Data Areas               │  │
│  │  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │ Method Area│  │   Heap Memory     │   │  │
│  │  └────────────┘  └──────────────────┘   │  │
│  │  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │   Stack    │  │  PC Registers     │   │  │
│  │  └────────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────┘  │
│                    ▼                            │
│  ┌──────────────────────────────────────────┐  │
│  │        Execution Engine                  │  │
│  │  - Interpreter                           │  │
│  │  - JIT Compiler                          │  │
│  │  - Garbage Collector                     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└────────────────────────────────────────────────┘
```

### 1. Class Loader Subsystem

**Nhiệm vụ:** Load `.class` files vào memory

```java
// Khi bạn viết:
MyClass obj = new MyClass();

// JVM làm:
// 1. Loading - Đọc MyClass.class từ disk
// 2. Linking - Verify bytecode, chuẩn bị static fields
// 3. Initialization - Chạy static initializers
```

### 2. Runtime Data Areas

**Method Area (Metaspace - Java 8+):**
- Lưu class metadata, static variables, constant pool
- Shared giữa tất cả threads

**Heap Memory:**
- Lưu objects và arrays
- Là nơi Garbage Collector làm việc
- Shared giữa tất cả threads

**Stack Memory:**
- Mỗi thread có 1 stack riêng
- Lưu local variables, method calls
- LIFO structure

**PC Registers:**
- Program Counter - địa chỉ instruction hiện tại

### 3. Execution Engine

**Interpreter:** Thực thi bytecode từng dòng (chậm)

**JIT Compiler:** Compile hot code thành native machine code (nhanh)

**Garbage Collector:** Tự động giải phóng bộ nhớ không dùng

## 🧹 Heap Memory Structure

Heap được chia thành các generations:

```
┌─────────────────────────────────────────────────┐
│                  Java Heap                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │        Young Generation                │    │
│  │  ┌──────┐  ┌─────────────────────┐    │    │
│  │  │ Eden │  │ Survivor 0 │ Survivor 1 │    │
│  │  └──────┘  └─────────────────────┘    │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │        Old Generation (Tenured)        │    │
│  │                                        │    │
│  └────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Tại sao chia generations?**
- Most objects "die young" - sống rất ngắn
- Collect young gen thường xuyên, nhanh hơn
- Old gen collect ít hơn (objects sống lâu)

## 🗑️ Garbage Collection Process

### 1. Object Lifecycle

```java
public void example() {
    String s1 = "Hello";           // 1. Tạo object trong Eden
    String s2 = new String("Hi");  // 2. Tạo object khác
    
    s1 = null;  // 3. s1 không reference → Eligible for GC
    
    // s2 vẫn còn reference → Không GC
}
// 4. Method kết thúc → s2 cũng eligible for GC
```

### 2. Minor GC (Young Generation)

**Khi Eden full:**

```
Step 1: Eden đầy
┌──────────┐  ┌──────┐  ┌──────┐
│   Eden   │  │  S0  │  │  S1  │
│ ████████ │  │      │  │      │
└──────────┘  └──────┘  └──────┘

Step 2: Minor GC - Copy live objects to S0
┌──────────┐  ┌──────┐  ┌──────┐
│   Eden   │  │  S0  │  │  S1  │
│          │  │ ███  │  │      │
└──────────┘  └──────┘  └──────┘

Step 3: Lần sau copy sang S1 (swap)
┌──────────┐  ┌──────┐  ┌──────┐
│   Eden   │  │  S0  │  │  S1  │
│          │  │      │  │ ███  │
└──────────┘  └──────┘  └──────┘
```

**Objects survive nhiều lần → Promote to Old Gen**

### 3. Major GC / Full GC (Old Generation)

Khi Old Gen full → Full GC:
- Stop-the-World (STW) - App pause
- Scan toàn bộ heap
- Chậm hơn Minor GC nhiều

## 🎯 GC Algorithms

### 1. Serial GC

```bash
java -XX:+UseSerialGC MyApp
```

- Single thread
- Stop-the-World
- Tốt cho single-core, app nhỏ

### 2. Parallel GC (Default Java 8)

```bash
java -XX:+UseParallelGC MyApp
```

- Multiple threads cho GC
- High throughput
- Vẫn có STW pauses

### 3. CMS (Concurrent Mark Sweep)

```bash
java -XX:+UseConcMarkSweepGC MyApp
```

- Low pause times
- Concurrent với app threads
- Deprecated từ Java 14

### 4. G1 GC (Default Java 9+)

```bash
java -XX:+UseG1GC MyApp
```

- Chia heap thành regions
- Predictable pause times
- Balanced throughput & latency

### 5. ZGC & Shenandoah (Java 11+)

```bash
java -XX:+UseZGC MyApp
```

- Ultra-low latency (<10ms pauses)
- Scalable (TB heaps)
- Production-ready từ Java 15+

## 🛠️ Tuning JVM Memory

### Heap Size

```bash
# Xem default settings
java -XX:+PrintFlagsFinal -version | grep HeapSize

# Set heap size
java -Xms512m -Xmx2g MyApp
# -Xms: Initial heap (512MB)
# -Xmx: Maximum heap (2GB)
```

### Generations

```bash
# Young generation size
java -Xmn512m MyApp

# New ratio (Old/Young)
java -XX:NewRatio=3 MyApp
# Old Gen = 3x Young Gen
```

### GC Logging

```bash
# Java 8
java -XX:+PrintGCDetails -XX:+PrintGCDateStamps \
     -Xloggc:gc.log MyApp

# Java 9+
java -Xlog:gc*:file=gc.log:time,uptime,level,tags MyApp
```

## 📊 Monitoring & Analysis

### VisualVM

```bash
# Start VisualVM
jvisualvm
```

- Monitor heap usage real-time
- CPU profiling
- Thread dump analysis

### JConsole

```bash
jconsole
```

- MBean monitoring
- Memory & thread stats

### GC Logs Analysis

```bash
# Install GCViewer
https://github.com/chewiebug/GCViewer

# Analyze gc.log
java -jar gcviewer.jar gc.log
```

## 💡 Best Practices

**1. Đừng gọi `System.gc()`**
```java
❌ System.gc()  // Suggestion, không guarantee chạy
✅ Let JVM decide
```

**2. Avoid memory leaks**
```java
❌ static List<Object> cache = new ArrayList<>();
   // Grow forever!

✅ Use WeakReference, SoftReference
   WeakHashMap<Object, Object> cache = new WeakHashMap<>();
```

**3. Monitor production**
```bash
# Enable GC logging
-Xlog:gc*:file=gc.log

# Monitor with tools
New Relic, DataDog, Prometheus + Grafana
```

**4. Tune cho workload**
```
High throughput → Parallel GC
Low latency → G1 GC / ZGC
Small heap → Serial GC
Large heap (>4GB) → G1 GC
```

## 🎓 Key Takeaways

✅ **JVM tự động quản lý memory** - Developer không lo lắng nhiều  
✅ **Heap có generations** - Young & Old cho efficiency  
✅ **Minor GC nhanh, Major GC chậm** - Optimize để giảm Full GC  
✅ **G1 GC là default modern** - Suitable cho most apps  
✅ **ZGC cho low-latency** - <10ms pause times  
✅ **Monitor & tune** - Mỗi app khác nhau  

---

**Resources:**

📚 [Oracle JVM Tuning Guide](https://docs.oracle.com/en/java/javase/21/gctuning/)  
🛠️ [GCEasy - GC Log Analyzer](https://gceasy.io/)  
📺 [Java Memory Management - Playlist](https://www.youtube.com/playlist?list=PLhfHPmPYPPRk6yMrcbfafFGSbE2EPK_A6)

---

*Hi vọng bài này giúp các bạn hiểu rõ hơn về JVM và Garbage Collection!* 🚀

**#Java #JVM #GarbageCollection #MemoryManagement #Performance**
