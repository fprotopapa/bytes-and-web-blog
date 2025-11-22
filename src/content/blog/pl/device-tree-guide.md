---
title: "Understanding Device Trees in Linux"
description: "A practical guide to device trees - how they describe hardware to the Linux kernel without hardcoding."
pubDate: 2024-11-05
author: pl/john-doe
coverImage: "/images/posts/device-tree.jpg"
tags: ["device-tree", "kernel", "hardware"]
category: "Kernel Development"
---

Device Tree is a data structure for describing hardware. Instead of hardcoding device information in the kernel, we use a separate, architecture-independent description.

![Yocto layer structure](/images/posts/jane-smith.jpg)

## Why Device Trees?

Before Device Trees:
- Board-specific code in kernel
- Difficult to maintain
- Kernel bloat with board files

With Device Trees:
- Hardware description separate from kernel
- Single kernel binary for multiple boards
- Easier hardware support

## Device Tree Structure

Device Trees are hierarchical, like a tree:

```dts
/ {
    model = "My Embedded Board";
    compatible = "vendor,board";

    cpus {
        cpu@0 {
            compatible = "arm,cortex-a7";
            device_type = "cpu";
            reg = <0>;
        };
    };

    memory@80000000 {
        device_type = "memory";
        reg = <0x80000000 0x20000000>; // 512MB
    };
};
```

## Basic Syntax

### Nodes

```dts
node_name@unit_address {
    property = value;
};
```

### Properties

```dts
compatible = "vendor,device";    // String
reg = <0x1000 0x100>;           // Array of cells
status = "okay";                 // Status
interrupts = <10>;               // Interrupt number
clock-frequency = <100000000>;   // Number
```

## Real Example: I2C Device

```dts
&i2c1 {
    status = "okay";
    clock-frequency = <400000>;

    eeprom@50 {
        compatible = "atmel,24c256";
        reg = <0x50>;
        pagesize = <64>;
    };

    rtc@68 {
        compatible = "dallas,ds1307";
        reg = <0x68>;
        interrupt-parent = <&gpio1>;
        interrupts = <5 IRQ_TYPE_EDGE_FALLING>;
    };
};
```

## Compiling Device Trees

### From DTS to DTB

```bash
# Compile device tree source to binary
dtc -I dts -O dtb -o board.dtb board.dts

# Decompile for inspection
dtc -I dtb -O dts -o board.dts board.dtb
```

### In Kernel Build

```bash
make ARCH=arm CROSS_COMPILE=arm-linux-gnueabi- dtbs
```

## Common Properties

### compatible

Identifies the device:

```dts
compatible = "vendor,specific-device", "generic-device";
```

### reg

Specifies address and size:

```dts
reg = <address size>;
```

### interrupts

Defines interrupt connections:

```dts
interrupts = <irq_number irq_flags>;
interrupt-parent = <&interrupt_controller>;
```

### clocks

References clock providers:

```dts
clocks = <&clk_provider CLK_ID>;
clock-names = "bus", "module";
```

## Overlays

Device Tree Overlays allow runtime modification:

```dts
/dts-v1/;
/plugin/;

/ {
    compatible = "vendor,board";

    fragment@0 {
        target = <&i2c1>;
        __overlay__ {
            sensor@40 {
                compatible = "ti,tmp102";
                reg = <0x40>;
            };
        };
    };
};
```

Apply overlay:

```bash
dtoverlay sensor-overlay
```

## Debugging Device Trees

### View Runtime Device Tree

```bash
# View full device tree
cat /sys/firmware/devicetree/base/...

# Better formatted
dtc -I fs /sys/firmware/devicetree/base
```

### Check Loaded Devices

```bash
ls /sys/firmware/devicetree/base/
cat /proc/device-tree/model
```

## Writing a Driver-Compatible DT Node

Example for a custom sensor:

```dts
my_sensor@20 {
    compatible = "mycompany,custom-sensor";
    reg = <0x20>;
    interrupt-parent = <&gpio2>;
    interrupts = <3 IRQ_TYPE_LEVEL_HIGH>;
    vdd-supply = <&reg_3v3>;
    reset-gpios = <&gpio1 10 GPIO_ACTIVE_LOW>;
};
```

Matching driver:

```c
static const struct of_device_id sensor_of_match[] = {
    { .compatible = "mycompany,custom-sensor", },
    { }
};
MODULE_DEVICE_TABLE(of, sensor_of_match);

static struct platform_driver sensor_driver = {
    .driver = {
        .name = "custom-sensor",
        .of_match_table = sensor_of_match,
    },
    .probe = sensor_probe,
    .remove = sensor_remove,
};
```

## Best Practices

1. Use appropriate compatible strings
2. Document your bindings
3. Follow naming conventions
4. Use standard properties when possible
5. Keep backwards compatibility
6. Test overlays thoroughly

## Resources

- [Device Tree Specification](https://www.devicetree.org)
- Kernel Documentation: `Documentation/devicetree/`
- Existing bindings: `Documentation/devicetree/bindings/`

Understanding Device Trees is essential for modern embedded Linux development. They provide flexibility and maintainability that board files never could.
