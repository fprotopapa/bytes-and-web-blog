---
title: "Embedded Linux from Scratch — Quick & Easy on QEMU"
pubDate: 2024-10-02
author: jane-smith
description: 'In this article, we’re going to create an embedded Linux system from scratch, emulate an ARM-based board, and run our system on it. What do we need? Five main elements are needed to successfully run embedded Linux on a target of our choice. Because we’re going to emulate our board with QEMU, we can omit [&hellip;]'
tags: ["yocto", "build-systems", "embedded-linux"]
category: "Systemy wbudowane"
---

In this article, we’re going to create an embedded Linux system from scratch, emulate an*ARM*-based board, and run our system on it.

## What do we need?

Five main elements are needed to successfully run embedded Linux on a target of our choice.

- Toolchain
- Bootloader
- Kernel
- Root filesystem
- A useful application 😉

Because we’re going to emulate our board with QEMU, we can omit the bootloader.

This was easy 😃. Let’s move on to the toolchain.

## What is a toolchain and why do we need it?

A toolchain allows us to compile source code into executables. To do so it consists of several utilities like a linker and assembler, a compiler, and libraries. A nice read with more details can be found[here](https://crosstool-ng.github.io/docs/toolchain-construction/). If the executable is later running on the same type of system as the host, it’s called a native toolchain. Our board’s processor is based on ARM and the host is based on x86\_64. Therefore, we have to cross-compile the source code and need a cross-toolchain.

Okay, great. But how do we get one?

There are two possibilities to choose from. Firstly, download a pre-built one, e.g.

- From [Bootlin](https://toolchains.bootlin.com/)
- Or [Linaro](https://www.linaro.org/downloads/).
- Even your favorite Linux distribution may have them packaged.

So, generally speaking: Search for it and go get them 😃.

Secondly, create your own. Here we’ll use*crosstool-NG*. Therefore, we first need to build crosstool-NG. Prequerities for some distributions can be found[here](https://github.com/crosstool-ng/crosstool-ng/tree/crosstool-ng-1.25.0/testing/docker). I’m using**Ubuntu 22.04**and run these commands:

`$ sudo apt-get update $ sudo apt-get install -y gcc g++ gperf bison flex texinfo help2man make libncurses5-dev \ python3-dev autoconf automake libtool libtool-bin gawk wget bzip2 xz-utils unzip \ patch libstdc++6 rsync git meson ninja-build dos2unix $ git clone https://github.com/crosstool-ng/crosstool-ng.git $ cd crosstool-ng $ git checkout tags/crosstool-ng-1.25.0 -b ct-ng $ # Clean files from \r $ find . -type f -exec dos2unix {} \; $ ./bootstrap $ ./configure --prefix=$(pwd)/bin $ make $ make install $ PATH="$PATH:$(pwd)/bin/bin"`

Great, now we can call the tool with the*ct-ng* command. Let’s have a look at some of the provided samples.

`$ ct-ng list-samples ... Status Sample name [L...] aarch64-ol7u9-linux-gnu [L...] aarch64-rpi3-linux-gnu [L...] aarch64-rpi4-linux-gnu [L..X] aarch64-unknown-linux-android [L...] aarch64-unknown-linux-gnu [L...] aarch64-unknown-linux-uclibc [L...] alphaev56-unknown-linux-gnu [L...] alphaev67-unknown-linux-gnu [L...] arc-arc700-linux-uclibc [L...] arc-archs-linux-gnu [L...] arc-multilib-elf32 [L...] arc-multilib-linux-gnu [L...] arc-multilib-linux-uclibc [L...] arm-bare_newlib_cortex_m3_nommu-eabi [L...] arm-cortex_a15-linux-gnueabihf [L..X] arm-cortexa5-linux-uclibcgnueabihf [L...] arm-cortex_a8-linux-gnueabi [L..X] arm-cortexa9_neon-linux-gnueabihf [L..X] x86_64-w64-mingw32,arm-cortexa9_neon-linux-gnueabihf [L...] armeb-unknown-eabi [L...] armeb-unknown-linux-gnueabi [L...] armeb-unknown-linux-uclibcgnueabi [L...] arm-multilib-linux-uclibcgnueabi [L...] arm-nano-eabi [L...] arm-ol7u9-linux-gnueabi ...`

Whoooa! That’s a lot. And what does it mean anyway?

The naming convention is:

*&lt;CPU Architecture&gt;-&lt;Vendor&gt;-&lt;Operating System&gt;-&lt;ABI / Libs&gt;*

**CPU architecture**: ARM (arm/aarch64), x86\_64, MIPS, … And information about endianess (\_eb/\_el)

**Vendor:**Toolchain supplier, e.g. buildroot, minGW. Often unknown or omitted.

**Operating System:**API specification, e.g. linux, win32.

**ABI (Application Binary Interface) / Libs:**User space (gnu, musle) and ABIs like EABI or EABIHF (Extended Application Binary Interface Hard-Float).

Let’s stick with the samples and choose*arm-unknown-linux-gnueabi.*To get more information we call:

`$ ct-ng show-arm-unknown-linux-gnueabi [L...] arm-unknown-linux-gnueabi Languages : C,C++ OS : linux-5.16.9 Binutils : binutils-2.38 Compiler : gcc-11.2.0 C library : glibc-2.35 Debug tools : duma-2_5_15 gdb-11.2 ltrace-0.7.3 strace-5.16 Companion libs : expat-2.4.1 gettext-0.21 gmp-6.2.1 isl-0.24 libelf-0.8.13 libiconv-1.16 mpc-1.2.1 mpfr-4.1.0 ncurses-6.2 zlib-1.2.12 Companion tools :`

Now we can examine if this cross-toolchain fulfills our requirements. I think it does 😃. If we want to configure it, we can choose*arm-unknown-linux-gnueabi*as a starting point. To adapt it even more we could use*menuconfig.*

`$ ct-ng arm-unknown-linux-gnueabi [L...] arm-unknown-linux-gnueabi Languages : C,C++ OS : linux-5.16.9 Binutils : binutils-2.38 Compiler : gcc-11.2.0 C library : glibc-2.35 Debug tools : duma-2_5_15 gdb-11.2 ltrace-0.7.3 strace-5.16 Companion libs : expat-2.4.1 gettext-0.21 gmp-6.2.1 isl-0.24 libelf-0.8.13 libiconv-1.16 mpc-1.2.1 mpfr-4.1.0 ncurses-6 Companion tools : $ ct-ng menuconfig`![](https://bytesandweb.pl/wp-content/uploads/2024/10/image.png)

Now let’s build it.

`$ ct-ng build ... [INFO ] Retrieving needed toolchain components tarballs [EXTRA] Retrieving 'linux-5.16.9' [EXTRA] Verifying SHA512 checksum for 'linux-5.16.9.tar.xz' [EXTRA] Retrieving 'zlib-1.2.12' [ERROR] zlib: download failed [ERROR] ...`

Noooooo!

![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-1.png)But let’s not panic. Crosstool-NG can’t download*zlib-1.2.12.* Tarballs are saved in ~/src. Therefore, we’ll place it there manually.

`$ mkdir ~/src && cd ~/src/ $ wget https://zlib.net/fossils/zlib-1.2.12.tar.gz $ cd - # And again ... $ ct-ng build [INFO ] Finalizing the toolchain s directory: done in 2.53s (at 33:03) [INFO ] Build completed at 20230119.174924 [INFO ] (elapsed: 33:02.82) [INFO ] Finishing installation (may take a few seconds)...$ $ cd ~ $ PATH="$PATH:$(pwd)/x-tools/arm-unknown-linux-gnueabi/bin"`

Yeahhh! Now an obligatory “hello world”! Save a file*helloworld.c*with the following content:

`#include <stdio.h> int main (void) { printf ("Hello, world!\n"); return 0; }`

Then compile it with our cross-toolchain:

`$ arm-unknown-linux-gnueabi-gcc helloworld.c -o helloworld $ file helloworld helloworld: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux.so.3, for GNU/Linux 5.16.9, with debug_info, not stripped`

It worked! We have an executable for ARM.

One main question arises. Why not just get a pre-built toolchain? And the answer is simple: You can 😃. As long as you can find one that suits you.

## I need a kernel!

Firstly, download the kernel source files.

`$ wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.16.9.tar.xz $ tar xf linux-5.16.9.tar.xz $ rm linux-5.16.9.tar.xz $ cd linux-5.16.9`

The kernel version needs to be greater or equal to the version specified by our toolchain.

`$ ct-ng show-arm-unknown-linux-gnueabi [L...] arm-unknown-linux-gnueabi Languages : C,C++ OS : linux-5.16.9 Binutils : binutils-2.38 Compiler : gcc-11.2.0 C library : glibc-2.35 Debug tools : duma-2_5_15 gdb-11.2 ltrace-0.7.3 strace-5.16 Companion libs : expat-2.4.1 gettext-0.21 gmp-6.2.1 isl-0.24 libelf-0.8.13 libiconv-1.16 mpc-1.2.1 mpfr-4.1.0 ncurses-6.2 zlib-1.2.12 Companion tools :`

Set our freshly build toolchain and configure our kernel. Under*/arch/arm/configs/*we can find ready-to-use configuration files. Here, we stick to Arm Versatile Express boards. Which is also available on QEMU.

`$ export ARCH=arm $ export CROSS_COMPILE=arm-unknown-linux-gnueabi- $ make vexpress_defconfig # # configuration written to .config #`

Now let’s compile it …

`$ make zImage -j$(nproc) ... fatal error: mpc.h: No such file or directory ... ...`

Nooo! But don’t worry. Getting this kind of error only means we have to install some packages. A quick google search will help us out. So in my case, I had to install*libmpc-dev*and*libgmp3-dev.*

`$ sudo apt install -y libmpc-dev libgmp3-dev $ make zImage -j$(nproc) ... CC arch/arm/boot/compressed/fdt_wip.o CC arch/arm/boot/compressed/fdt.o CC arch/arm/boot/compressed/fdt_check_mem_start.o SHIPPED arch/arm/boot/compressed/lib1funcs.S SHIPPED arch/arm/boot/compressed/ashldi3.S SHIPPED arch/arm/boot/compressed/bswapsdi2.S AS arch/arm/boot/compressed/hyp-stub.o AS arch/arm/boot/compressed/lib1funcs.o AS arch/arm/boot/compressed/ashldi3.o AS arch/arm/boot/compressed/bswapsdi2.o AS arch/arm/boot/compressed/piggy.o LD arch/arm/boot/compressed/vmlinux OBJCOPY arch/arm/boot/zImage Kernel: arch/arm/boot/zImage is ready $ make modules -j$(nproc) CALL scripts/atomic/check-atomics.sh CALL scripts/checksyscalls.sh LDS scripts/module.lds MODPOST modules-only.symvers GEN Module.symvers $ make dtbs -j$(nproc) DTC arch/arm/boot/dts/vexpress-v2p-ca5s.dtb DTC arch/arm/boot/dts/vexpress-v2p-ca9.dtb DTC arch/arm/boot/dts/vexpress-v2p-ca15-tc1.dtb DTC arch/arm/boot/dts/vexpress-v2p-ca15_a7.dtb`

Now we have a zImage and a compiled Device Tree under*/arch/arm/boot*.

![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-2.png)# But there is no board!?

To make our lives easier, we’re going to use an emulator called QEMU. Let’s shortly introduce QEMU:

> > QEMU is a free and open-source emulator (Quick EMUlator). It emulates the machine’s processor through dynamic binary translation and provides a set of different hardware and device models for the machine, enabling it to run a variety of guest operating systems. It can interoperate with Kernel-based Virtual Machine (KVM) to run virtual machines at near-native speed. QEMU can also do emulation for user-level processes, allowing applications compiled for one architecture to run on another.
> > 
> > — Source:<https://en.wikipedia.org/wiki/QEMU>

Downloading QEMU and installing is pretty straightforward. So, let’s do it!

`$ sudo apt install -y pkg-config libglib2.0-dev libpixman-1-dev $ mkdir tools && cd $_ $ wget https://download.qemu.org/qemu-7.2.0.tar.xz $ tar xvJf qemu-7.2.0.tar.xz $ cd qemu-7.2.0 $ ./configure --target-list=arm-softmmu $ make $ PATH="$PATH:$(pwd)/build/arm-softmmu"`

Now we can call QEMU with*qemu-system-arm.* Let’s give it a try!

We’re telling QEMU that our board is*vexpress-a9*with 256MB RAM, pointing to our kernel image and compiled Device Tree, and passing a serial terminal.

`$ cd ~/linux-5.16.9 $ qemu-system-arm -M help ... versatileab ARM Versatile/AB (ARM926EJ-S) versatilepb ARM Versatile/PB (ARM926EJ-S) vexpress-a15 ARM Versatile Express for Cortex-A15 vexpress-a9 ARM Versatile Express for Cortex-A9 virt-2.10 QEMU 2.10 ARM Virtual Machine virt-2.11 QEMU 2.11 ARM Virtual Machine virt-2.12 QEMU 2.12 ARM Virtual Machine ... $ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \ -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \ -append "console=ttyAMA0,115200" -nographic Please append a correct "root=" boot option; here are the available partitions: 1f00 131072 mtdblock0 (driver?) 1f01 32768 mtdblock1 (driver?) Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0) CPU: 0 PID: 1 Comm: swapper/0 Not tainted 5.16.9 #1 Hardware name: ARM-Versatile Express`

Not again! Why do we get a kernel panic? Because we didn’t create a root filesystem and therefore it couldn’t be mounted.

![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-3.png)To terminate QEMU:*STRG + a x (First: STRG + a, then: x)*

## We need a root filesystem!

A quick recap on root filesystems:

> > The root file system is the top of the hierarchical file tree. It contains the files and directories critical for system operation, including the device directory and programs for booting the system. The root file system also contains mount points where file systems can be mounted to connect to the root file system hierarchy.
> > 
> > — Source:<https://www.ibm.com/docs/pl/aix/7.1?topic=tree-root-file-system>

A root filesystem needs a folder structure, as is shown below:

```/ ├── bin ├── dev ├── etc ├── lib ├── proc ├── sbin ├── sys ├── tmp ├── usr └── var```

Besides the folder structure, it needs an init program, a shell, device nodes, libraries, pseudo filesystems, and some basic programs.

Let’s start with the folder structure.

```$ mkdir ~/rootfs && cd $_ $ mkdir bin dev etc home lib proc sbin sys tmp usr var $ mkdir -p usr/bin usr/lib usr/sbin var/log```

Now we need B*usyBox*. Busybox gives us all the necessary and useful programs to run Linux successfully. A short introduction to BusyBox:

> > BusyBox is a software suite that provides several Unix utilities in a single executable file. It runs in a variety of POSIX environments such as Linux, Android, and FreeBSD, although many of the tools it provides are designed to work with interfaces provided by the Linux kernel. It was specifically created for embedded operating systems with very limited resources. The authors dubbed it „The Swiss Army knife of Embedded Linux”, as the single executable replaces basic functions of more than 300 common commands.
> > 
> > — Source:<https://en.wikipedia.org/wiki/BusyBox>

Let’s build BusyBox for our root filesystem.

```$ cd ~ $ git clone git://busybox.net/busybox.git $ cd busybox $ git checkout tags/1_36_0 -b bb # We need to export ARCH & CROSS_COMPILE # (Export vars and path again after closing terminal) # PATH="$PATH:~/x-tools/arm-unknown-linux-gnueabi/bin" # export ARCH=arm # export CROSS_COMPILE=arm-unkown-linux-gnueabi- $ make defconfig $ make menuconfig # Settings -> Installation Options -> Destination path for 'make install' # Enter ../rootfs $ make $ make install```![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-4.png)

What did it do? What does the root filesystem look like?

```$ cd ~/rootfs $ tree . ├── bin │ ├── arch -> busybox │ ├── ash -> busybox │ ├── base32 -> busybox │ ├── base64 -> busybox │ ├── busybox │ ├── cat -> busybox | ... ├── dev ├── etc ├── home ├── lib ├── linuxrc -> bin/busybox ├── proc ├── sbin │ ├── acpid -> ../bin/busybox │ ├── adjtimex -> ../bin/busybox │ ├── arp -> ../bin/busybox │ ├── blkid -> ../bin/busybox │ ├── blockdev -> ../bin/busybox | ... ├── sys ├── tmp ├── usr │ ├── bin │ │ ├── [ -> ../../bin/busybox │ │ ├── [[ -> ../../bin/busybox │ │ ├── ascii -> ../../bin/busybox │ │ ├── awk -> ../../bin/busybox │ │ ├── basename -> ../../bin/busybox │ │ ├── bc -> ../../bin/busybox │ │ ├── beep -> ../../bin/busybox | | ... │ ├── lib │ └── sbin │ ├── addgroup -> ../../bin/busybox │ ├── add-shell -> ../../bin/busybox │ ├── adduser -> ../../bin/busybox │ ├── arping -> ../../bin/busybox │ ├── brctl -> ../../bin/busybox │ ├── chat -> ../../bin/busybox | ... └── var └── log```

Now we need to find out which libraries are used. Otherwise, BusyBox can also be built using static compilation. Then we don’t have to worry about shared libraries but it increases the binary size.

```$ arm-unknown-linux-gnueabi-readelf -a bin/busybox | grep "program interpreter" [Requesting program interpreter: /lib/ld-linux.so.3] $ arm-unknown-linux-gnueabi-readelf -a bin/busybox | grep "Shared library" 0x00000001 (NEEDED) Shared library: [libm.so.6] 0x00000001 (NEEDED) Shared library: [libresolv.so.2] 0x00000001 (NEEDED) Shared library: [libc.so.6]```

Those libraries are located at*sysroot.* We should also check if there are symbolic links to our libraries (in this case there are no links) and copy everything to*rootfs/lib*.

```$ arm-unknown-linux-gnueabi-gcc -print-sysroot /home/op/x-tools/arm-unknown-linux-gnueabi/arm-unknown-linux-gnueabi/sysroot $ export SYSROOT=$(arm-unknown-linux-gnueabi-gcc -print-sysroot) # Check for symbolic links $ ls -l $SYSROOT/lib -r-xr-xr-x 1 op op 1232784 Jan 19 17:33 ld-linux.so.3 -r-xr-xr-x 1 op op 12380024 Jan 19 17:33 libc.so.6 -r-xr-xr-x 1 op op 1804408 Jan 19 17:33 libm.so.6 -r-xr-xr-x 1 op op 239892 Jan 19 17:33 libresolv.so.2 ... $ cp $SYSROOT/lib/ld-linux.so.3 lib $ cp $SYSROOT/lib/libm.so.6 lib $ cp $SYSROOT/lib/libresolv.so.2 lib $ cp $SYSROOT/lib/libc.so.6 lib```

For our small Linux system, we need no more to get started. Let’s create a*initramfs*. This is a filesystem being loaded into RAM. Therefore, we create a*cpio* archive and compress it with gzip (the last step is optional).

```$ find . | cpio -H newc -ov --owner root:root > ../initramfs.cpio $ cd .. && gzip initramfs.cpio```

Now, let’s fire up again QEMU! This time we provide additionally the*initrd* (Pointing to the root filesystem) and rdinit=/bin/sh argument (Starting an interactive shell).

```$ cd linux-5.16.9 $ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \ -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \ -append "console=ttyAMA0 rdinit=/bin/sh" -nographic \ -initrd ../initramfs.cpio.gz```

After the boot succeeds, pressing*Enter* brings us to the shell.

```... ALSA device list: #0: ARM AC'97 Interface PL041 rev0 at 0x10004000, irq 32 Freeing unused kernel image (initmem) memory: 1024K Run /bin/sh as init process /bin/sh: can t access tty; job control turned off ~ # input: ImExPS/2 Generic Explorer Mouse as /devices/platform/bus@40000000/bus@40000000:motherboard-bus@40000000/bus@40000000:motherboard-bus@40000000:iofpga@7,00000000/10007000.kmi/serio1/input/input2 random: fast init done ~ # ls bin etc lib proc sbin tmp var dev home linuxrc root sys usr```

Success 😎!

## Let’s create an application!

We could come up with something like this, improving the*helloworld* program.

```#include <stdio.h> int main() { while(1) { char name[30]; printf("Enter name: \n"); scanf("%s", name); printf("Hello %s.\n", name); } return 0; }```

Compile it and move it to the root filesystem.

```$ arm-unknown-linux-gnueabi-gcc helloworld.c -o helloworld $ file helloworld helloworld: ELF 32-bit LSB executable, ARM, EABI5 version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux.so.3, for GNU/Linux 5.16.9, with debug_info, not stripped $ mv helloworld rootfs/usr/bin/ $ chmod +x rootfs/usr/bin/helloworld # Create again a new archive $ cd rootfs $ find . | cpio -H newc -ov --owner root:root > ../initramfs.cpio $ cd .. && gzip initramfs.cpio```

Probably it is worth checking the libraries needed. In this case, we already have them included.

```$ arm-unknown-linux-gnueabi-readelf -a rootfs/usr/bin/helloworld | grep "program interpreter" [Requesting program interpreter: /lib/ld-linux.so.3] $ arm-unknown-linux-gnueabi-readelf -a rootfs/usr/bin/helloworld | grep "Shared library" 0x00000001 (NEEDED) Shared library: [libc.so.6]```

Great, let’s test the application!

```
$ cd linux-5.16.9 $ qemu-system-arm -M vexpress-a9 \
    -m 256M -kernel arch/arm/boot/zImage \ 
    -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \ 
    -append "console=ttyAMA0 rdinit=/bin/sh" -nographic \ 
    -initrd ../initramfs.cpio.gz ... 
    ~ # helloworld Enter name: World Hello World. Enter name:
```

And it worked! But it is unfortunate that we have to manually run the program. After all, it’s an embedded device 😉. Passing*helloworld* to*rdinit* should fix the problem.

```
$ qemu-system-arm -M vexpress-a9 -m 256M -kernel arch/arm/boot/zImage \ -dtb arch/arm/boot/dts/vexpress-v2p-ca9.dtb \ -append "console=ttyAMA0 rdinit=/usr/bin/helloworld" -nographic \ -initrd ../initramfs.cpio.gz ... Freeing unused kernel image (initmem) memory: 1024K Run /usr/bin/helloworld as init process Enter name: World Hello World. ...
```

Still there? Great!

![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-5.png)# Let’s recap …

In this article, we created a cross-toolchain for an ARM processor. Then we compiled the Linux kernel for the Arm Versatile Express board. To run the kernel and emulate the board we set up QEMU. After that, the root filesystem was created and populated with our application.

So we created an embedded Linux system from scratch! 😎

Most of the time, this approach isn’t suitable and the recommended way would be to use build systems like Yocto or Buildroot. But it’s fun and good to know for a better understanding of how to develop embedded Linux systems.

I hope you enjoyed it and thanks for reading!
