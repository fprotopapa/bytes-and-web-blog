---
title: "U-Boot Bootloader Fundamentals"
description: "Understanding U-Boot, the universal bootloader for embedded systems and how to configure it for your platform."
pubDate: 2024-11-18
author: pl/fabbio-protopapa
coverImage: "/images/posts/u-boot.jpg"
tags: ["bootloader", "u-boot", "firmware"]
category: "Bootloaders"
draft: true
---

U-Boot (Universal Boot Loader) is the most popular bootloader for embedded Linux systems. It's responsible for initializing hardware and loading the operating system.

## What Does U-Boot Do?

1. Initialize RAM and hardware peripherals
2. Load the Linux kernel into memory
3. Pass boot parameters to the kernel
4. Provide boot-time diagnostics
5. Allow interactive boot configuration

## Boot Sequence

```
Power-On → ROM Code → SPL/MLO → U-Boot → Linux Kernel → Init
```

## Building U-Boot

### Prerequisites

```bash
sudo apt-get install gcc-arm-linux-gnueabi \
     device-tree-compiler u-boot-tools
```

### Download and Build

```bash
git clone https://github.com/u-boot/u-boot.git
cd u-boot

# Configure for your board (example: Raspberry Pi 3)
make rpi_3_defconfig

# Build
make CROSS_COMPILE=arm-linux-gnueabi-
```

## U-Boot Environment Variables

U-Boot uses environment variables for configuration:

```bash
# View all variables
printenv

# Set a variable
setenv bootargs console=ttyS0,115200

# Save to persistent storage
saveenv
```

## Common Boot Commands

### Boot from SD Card

```bash
fatload mmc 0:1 ${kernel_addr_r} zImage
fatload mmc 0:1 ${fdt_addr_r} devicetree.dtb
bootz ${kernel_addr_r} - ${fdt_addr_r}
```

### Boot from Network (TFTP)

```bash
setenv serverip 192.168.1.100
setenv ipaddr 192.168.1.10
tftp ${kernel_addr_r} zImage
tftp ${fdt_addr_r} devicetree.dtb
bootz ${kernel_addr_r} - ${fdt_addr_r}
```

## Device Tree

U-Boot needs to pass the device tree to Linux:

```bash
# Load device tree
fdt addr ${fdt_addr_r}
fdt print /
```

## Creating Boot Scripts

Automate boot with a boot script:

```bash
# Create boot.cmd
cat > boot.cmd << EOF
setenv bootargs console=ttyS0,115200 root=/dev/mmcblk0p2 rw
fatload mmc 0:1 ${kernel_addr_r} zImage
fatload mmc 0:1 ${fdt_addr_r} devicetree.dtb
bootz ${kernel_addr_r} - ${fdt_addr_r}
EOF

# Compile to boot.scr
mkimage -C none -A arm -T script -d boot.cmd boot.scr
```

## Debugging Tips

### Enable Verbose Output

```bash
setenv bootargs ${bootargs} earlyprintk debug
```

### Check Memory

```bash
md.b ${kernel_addr_r} 0x100
```

### Test Device Tree

```bash
fdt addr ${fdt_addr_r}
fdt print /
```

## Customizing U-Boot

Edit `include/configs/your_board.h` for:
- Default environment variables
- Boot delays
- Command configuration
- Memory mappings

## Conclusion

Understanding U-Boot is crucial for embedded Linux development. It's your first line of defense when bringing up new hardware.

Next time, we'll dive into customizing U-Boot for specific hardware platforms!
