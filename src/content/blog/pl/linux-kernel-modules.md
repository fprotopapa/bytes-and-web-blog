---
title: "Writing Your First Linux Kernel Module"
description: "Learn how to write, compile, and load a simple Linux kernel module for embedded systems."
pubDate: 2024-11-10
author: pl/john-doe
coverImage: "/images/posts/kernel-module.jpg"
tags: ["kernel", "drivers", "c-programming"]
category: "Kernel Development"
---

Kernel modules are pieces of code that can be loaded and unloaded into the kernel upon demand. They extend the functionality of the kernel without the need to reboot the system.

## Why Use Kernel Modules?

- Add support for new hardware
- Implement new filesystems
- Extend kernel functionality
- Debug kernel code
- No need to recompile entire kernel

## Your First Module

Let's create a simple "Hello World" kernel module.

### hello.c

```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("John Doe");
MODULE_DESCRIPTION("A simple Hello World module");
MODULE_VERSION("1.0");

static int __init hello_init(void)
{
    printk(KERN_INFO "Hello, World! Module loaded.\n");
    return 0;
}

static void __exit hello_exit(void)
{
    printk(KERN_INFO "Goodbye, World! Module unloaded.\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

## The Makefile

Create a Makefile to compile your module:

```makefile
obj-m += hello.o

all:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```

## Building and Loading

1. **Compile the module:**

```bash
make
```

2. **Load the module:**

```bash
sudo insmod hello.ko
```

3. **Check kernel messages:**

```bash
dmesg | tail
```

4. **Unload the module:**

```bash
sudo rmmod hello
```

## Understanding Module Parameters

You can pass parameters to your module:

```c
static int param = 0;
module_param(param, int, S_IRUGO);
MODULE_PARM_DESC(param, "An integer parameter");
```

Load with parameter:

```bash
sudo insmod hello.ko param=42
```

## Best Practices

- Always check return values
- Clean up resources in exit function
- Use appropriate log levels with printk
- Test thoroughly before deploying
- Follow kernel coding style

## Conclusion

Kernel modules are powerful tools for extending Linux functionality. Start simple, test often, and gradually build more complex modules.

In the next post, we'll explore character device drivers!
