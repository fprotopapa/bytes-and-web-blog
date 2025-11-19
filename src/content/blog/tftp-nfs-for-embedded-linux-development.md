---
date: '2024-10-02 17:38:49'
modified: '2024-10-02 18:09:57'
slug: tftp-nfs-for-embedded-linux-development
id: 312
type: post
excerpt: 'In this article, we’re going to set up a TFTP (Trivial File Transfer Protocol) and NFS (Network File System) server and use it to boot a Raspberry Pi 4 (RPI). To make our lives easier, we’ll use U-Boot as our bootloader. Why would we need it? In the early (and beyond) stages of development, we [&hellip;]'
permalink: 'https://bytesandweb.pl/tftp-nfs-for-embedded-linux-development/'
category:
    - 'Systemy wbudowane'
---

# TFTP &amp; NFS for Embedded Linux Development

In this article, we’re going to set up a TFTP (Trivial File Transfer Protocol) and NFS (Network File System) server and use it to boot a Raspberry Pi 4 (RPI). To make our lives easier, we’ll use U-Boot as our bootloader.

Why would we need it?

In the early (and beyond) stages of development, we often need to change, edit, and recompile our projects. Development boards will mostly use an SD card to boot. To reduce the iteration time, we can omit unplugging, mounting, copying, and so on. This is possible through the use of network protocols, allowing us to keep the files on our host machine.

# What do we need?

A host machine running Ubuntu 22.04 (at least this is what I use), a USB-UART converter, an SD card, a card reader, and a Raspberry Pi 4 (or whatever you can get your hands on 😃).

That’s pretty much it. So let’s jump right in!

# Trivial File Transfer Protocol

Why should we use TFTP in the first place?

> > Trivial File Transfer Protocol (TFTP) is a simple lockstep File Transfer Protocol which allows a client to get a file from or put a file onto a remote host. One of its primary uses is in the early stages of nodes booting from a local area network. TFTP has been used for this application because it is very simple to implement.
> > 
> > Due to its simple design, TFTP can be easily implemented by code with a small memory footprint. It is therefore the protocol of choice for the initial stages of any network booting strategy
> > 
> > Source:[Wikipedia](https://en.wikipedia.org/wiki/Trivial_File_Transfer_Protocol#:~:text=Trivial%20File%20Transfer%20Protocol%20(TFTP,from%20a%20local%20area%20network.)
> 
> Firstly, we have to install a TFTP server and create a folder to store our files.
> 
> `$ mkdir -p /home/${USER}/tftp $ sudo apt-get install tftpd-hpa`

Next, we should change the permissions. The TFTP daemon needs to be able to access the folder and of course, our user must be able to store files in it.

`# We should have a tftp user $ cat /etc/passwd ... tftp:x:133:139:tftp daemon,,,:/srv/tftp:/usr/sbin/nologin ... $ sudo chown tftp:tftp /home/${USER}/tftp $ sudo chmod -R 777 /home/${USER}/tftp`

Now we’ve to change the configuration. It should be modified to look like this:

`$ sudo vim /etc/default/tftpd-hpa TFTP_USERNAME="tftp" TFTP_DIRECTORY="/home/<user>/tftp" TFTP_ADDRESS="0.0.0.0:6900" TFTP_OPTIONS="--create --secure"`

One important thing to notice: The standard port for TFTP is 69. This may lead to conflicts with other services. U-Boot has the ability to use a different port. You can check your ports, e.g. using:

`$ sudo netstat -lnp | grep 69 udp6 0 0 :::69 :::* 1246/xinetd `

As shown above, my port 69 is already in use. Therefore, it comes in handy to be able to just use a different one 😃.

Now we can start the TFTP daemon.

`$ sudo systemctl start tftpd-hpa # Check the status, it should look like this $ sudo systemctl status tftpd-hpa ● tftpd-hpa.service - LSB: HPA's tftp server Loaded: loaded (/etc/init.d/tftpd-hpa; generated) Active: active (running) since Thu 2023-05-11 20:45:29 CEST; 12s ago Docs: man:systemd-sysv-generator(8) Process: 3502 ExecStart=/etc/init.d/tftpd-hpa start (code=exited, status=0/SUCCESS) Tasks: 1 (limit: 18571) Memory: 412.0K CPU: 47ms CGroup: /system.slice/tftpd-hpa.service └─3510 /usr/sbin/in.tftpd --listen --user tftp --address 0.0.0.0:6900 --create> May 11 20:45:29 build systemd[1]: Starting LSB: HPA's tftp server... May 11 20:45:29 build tftpd-hpa[3502]: * Starting HPA's tftpd in.tftpd May 11 20:45:29 build tftpd-hpa[3502]: ...done. May 11 20:45:29 build systemd[1]: Started LSB: HPA's tftp server.`

It won’t hurt to test it real quick. So we’ve to create a file in our TFTP folder and transfer it.

`$ cd ~ $ echo "Test transfer" > ./tftp/test.txt $ tftp tftp> connect localhost 6900 tftp> get test.txt Received 15 bytes in 0.0 seconds tftp> quit $ cat test.txt Test transfer`

Success!!! Now let’s move on with the NFS server.

[via GIPHY](https://giphy.com/gifs/TheDemocrats-dnc-democrats-dncgif-6H6pJ3plqdHipAveUD)

# Network File System

So, what is NFS?

> > NFS is a distributed file system protocol allowing a user on a client computer to access files over a computer network much like local storage is accessed. NFS, like many other protocols, builds on the Open Network Computing Remote Procedure Call (ONC RPC) system.
> > 
> > Source:[Wikipedia](https://en.wikipedia.org/wiki/Network_File_System)

Linux has support for NFS and also allows us to boot our root filesystem using NFS.

Setting up an NFS server is even easier than with TFTP. First, let’s install the NFS server, create a shared folder, and set the permissions.

`$ sudo apt-get install nfs-kernel-server $ sudo mkdir /home/${USER}/nfs $ sudo chmod 777 /home/${USER}/nfs`

Now we have to make our folder known to the NFS server and set the permissions.

`$ sudo vim /etc/exports /home/<user>/nfs *(rw,sync,no_root_squash,no_subtree_check)`

- **\***: Allow all IPs
- **rw**: Export folder as read &amp; write
- **sync**: Selecting the synchronous version
- **no\_root\_squash**: Disables subtree checking (Can improve reliability)
- **no\_subtree\_check**: Requests from user ID 0 are processed without squashing to a different user ID

Finally, let’s restart the service.

`$ sudo service nfs-kernel-server restart`

If everything went well, we can now boot through NFS.

# Create image, bootloader, and so on

To make our lives easier, we’ll use Buildroot to create everything needed.

`$ mkdir rpi4 && cd $_ $ git clone https://github.com/buildroot/buildroot.git $ cd buildroot $ git checkout tags/2022.02.12`

Let’s see what defconfigs are supported.

`$ make list-defconfigs | grep "raspberrypi*" raspberrypi0_defconfig - Build for raspberrypi0 raspberrypi0w_defconfig - Build for raspberrypi0w raspberrypi2_defconfig - Build for raspberrypi2 raspberrypi3_64_defconfig - Build for raspberrypi3_64 raspberrypi3_defconfig - Build for raspberrypi3 raspberrypi3_qt5we_defconfig - Build for raspberrypi3_qt5we raspberrypi4_64_defconfig - Build for raspberrypi4_64 raspberrypi4_defconfig - Build for raspberrypi4 raspberrypicm4io_64_defconfig - Build for raspberrypicm4io_64 raspberrypicm4io_defconfig - Build for raspberrypicm4io raspberrypi_defconfig - Build for raspberrypi raspberrypizero2w_defconfig - Build for raspberrypizero2w`

Building for the Raspberry Pi 4, let’s choose raspberrypi4\_64\_defconfig.

`$ make O=/home/${USER}/rpi4/build raspberrypi4_64_defconfig $ cd ../build`

Next, we’ve to configure Buildroot. We’ll choose a newer U-Boot version because it’ll allow us to change the TFTP port.

`$ make menuconfig Filesystem images -> tar the root filesystem Bootloaders -> U-Boot Bootloaders -> U-Boot -> U-Boot version: Custom version Bootloaders -> U-Boot -> U-Boot version: 2023.04 Bootloaders -> U-Boot -> Build system: Kconfig Bootloaders -> U-Boot -> Board defconfig: rpi_arm64`

Let’s check if Linux is prepared for NFS.

`$ make linux-menuconfig # If we encounter problems we can disable the initial RAM FS General setup -> Initial RAM filesystem and RAM disk (initramfs/initrd) support: Disable # NFS is mostly already enabled but we should disable NFS verion 2 File systems -> Network File Systems -> ...`![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-6.png)

We should remove NFS version 2 support.

Next, we have to enable U-Boot’s ability to select a different TFTP port.

`$ make uboot-menuconfig Networking support -> Set TFTP UDP source/destination ports via the environment `

Finally, we can build …

`$ make`

If you’re getting errors, check the prerequisites and development packages to build Linux 😉. If not, move on!

# Formatting the SD card

Now we have to prepare the SD card.

After plugging in the SD card, we have to find out its name. E.g. we can use dmesg or lsblk. It’s important to definitely identify the card we want to work with!!!

`$ sudo dmesg | tail [sudo] password for op: [10416.824858] sd 6:0:0:0: Attached scsi generic sg2 type 0 [10416.825236] scsi 6:0:0:1: Attached scsi generic sg3 type 0 [10417.054587] sd 6:0:0:0: [sdb] 62357504 512-byte logical blocks: (31.9 GB/29.7 GiB) [10417.055601] sd 6:0:0:0: [sdb] Write Protect is off [10417.055606] sd 6:0:0:0: [sdb] Mode Sense: 21 00 00 00 [10417.056370] sd 6:0:0:0: [sdb] Write cache: disabled, read cache: enabled, doesn't support DPO or FUA [10417.057339] sd 6:0:0:1: [sdc] Media removed, stopped polling [10417.058474] sd 6:0:0:1: [sdc] Attached SCSI removable disk [10417.066080] sdb: sdb1 [10417.068324] sd 6:0:0:0: [sdb] Attached SCSI removable disk $ lsblk NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS ... sdb 8:16 1 29.1G 0 disk ├─sdb1 8:17 1 32M 0 part └─sdb2 8:18 1 512M 0 part ...`

To format the SD card we can use e.g. fdisk, GParted. Here I’ll use fdisk. First, we need to delete existing partitions (we also have to unmount the card).

`$ sudo umount ... $ sudo fdisk /dev/sdb Welcome to fdisk (util-linux 2.37.2). Changes will remain in memory only, until you decide to write them. Be careful before using the write command. Command (m for help): p Disk /dev/sdb: 29.12 GiB, 31267487744 bytes, 61069312 sectors Disk model: STORAGE DEVICE Units: sectors of 1 * 512 = 512 bytes Sector size (logical/physical): 512 bytes / 512 bytes I/O size (minimum/optimal): 512 bytes / 512 bytes Disklabel type: dos Disk identifier: 0x00000000 Device Boot Start End Sectors Size Id Type /dev/sdb1 * 1 65536 65536 32M c W95 FAT32 (LBA) /dev/sdb2 65537 1114112 1048576 512M 83 Linux Command (m for help): d Partition number (1,2, default 2): 1 Partition 1 has been deleted. Command (m for help): d Selected partition 2 Partition 2 has been deleted.`

Next, we have to create new partitions.

`Command (m for help): n Partition type p primary (0 primary, 0 extended, 4 free) e extended (container for logical partitions) Select (default p): Using default response p. Partition number (1-4, default 1): First sector (2048-61069311, default 2048): Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-61069311, default 61069311): +1G Created a new partition 1 of type 'Linux' and of size 1 GiB. Command (m for help): n Partition type p primary (1 primary, 0 extended, 3 free) e extended (container for logical partitions) Select (default p): Using default response p. Partition number (2-4, default 2): First sector (2099200-61069311, default 2099200): Last sector, +/-sectors or +/-size{K,M,G,T,P} (2099200-61069311, default 61069311): Created a new partition 2 of type 'Linux' and of size 28.1 GiB.`

Now we’ll create a boot partition.

`Command (m for help): a Partition number (1,2, default 2): 1 The bootable flag on partition 1 is enabled now.`

Then we’ve to set the partition’s formats. The boot partition should be FAT32 and the rootfs in ext format.

`Command (m for help): t Partition number (1,2, default 2): 1 Hex code or alias (type L to list all): L 00 Empty 24 NEC DOS 81 Minix / old Lin bf Solaris 01 FAT12 27 Hidden NTFS Win 82 Linux swap / So c1 DRDOS/sec (FAT- 02 XENIX root 39 Plan 9 83 Linux c4 DRDOS/sec (FAT- 03 XENIX usr 3c PartitionMagic 84 OS/2 hidden or c6 DRDOS/sec (FAT- 04 FAT16 <32M 40 Venix 80286 85 Linux extended c7 Syrinx 05 Extended 41 PPC PReP Boot 86 NTFS volume set da Non-FS data 06 FAT16 42 SFS 87 NTFS volume set db CP/M / CTOS / . 07 HPFS/NTFS/exFAT 4d QNX4.x 88 Linux plaintext de Dell Utility 08 AIX 4e QNX4.x 2nd part 8e Linux LVM df BootIt 09 AIX bootable 4f QNX4.x 3rd part 93 Amoeba e1 DOS access 0a OS/2 Boot Manag 50 OnTrack DM 94 Amoeba BBT e3 DOS R/O 0b W95 FAT32 51 OnTrack DM6 Aux 9f BSD/OS e4 SpeedStor 0c W95 FAT32 (LBA) 52 CP/M a0 IBM Thinkpad hi ea Linux extended 0e W95 FAT16 (LBA) 53 OnTrack DM6 Aux a5 FreeBSD eb BeOS fs 0f W95 Ext'd (LBA) 54 OnTrackDM6 a6 OpenBSD ee GPT 10 OPUS 55 EZ-Drive a7 NeXTSTEP ef EFI (FAT-12/16/ 11 Hidden FAT12 56 Golden Bow a8 Darwin UFS f0 Linux/PA-RISC b 12 Compaq diagnost 5c Priam Edisk a9 NetBSD f1 SpeedStor 14 Hidden FAT16 <3 61 SpeedStor ab Darwin boot f4 SpeedStor 16 Hidden FAT16 63 GNU HURD or Sys af HFS / HFS+ f2 DOS secondary 17 Hidden HPFS/NTF 64 Novell Netware b7 BSDI fs fb VMware VMFS 18 AST SmartSleep 65 Novell Netware b8 BSDI swap fc VMware VMKCORE 1b Hidden W95 FAT3 70 DiskSecure Mult bb Boot Wizard hid fd Linux raid auto 1c Hidden W95 FAT3 75 PC/IX bc Acronis FAT32 L fe LANstep 1e Hidden W95 FAT1 80 Old Minix be Solaris boot ff BBT Aliases: linux - 83 swap - 82 extended - 05 uefi - EF raid - FD lvm - 8E linuxex - 85 Hex code or alias (type L to list all): b Changed type of partition 'Linux' to 'W95 FAT32'. Command (m for help): t Partition number (1,2, default 2): Hex code or alias (type L to list all): 83 Changed type of partition 'Linux' to 'Linux'. Command (m for help): p Disk /dev/sdb: 29.12 GiB, 31267487744 bytes, 61069312 sectors Disk model: STORAGE DEVICE Units: sectors of 1 * 512 = 512 bytes Sector size (logical/physical): 512 bytes / 512 bytes I/O size (minimum/optimal): 512 bytes / 512 bytes Disklabel type: dos Disk identifier: 0x00000000 Device Boot Start End Sectors Size Id Type /dev/sdb1 * 2048 2099199 2097152 1G b W95 FAT32 /dev/sdb2 2099200 61069311 58970112 28.1G 83 Linux`

And we have to save the changes.

`Command (m for help): w The partition table has been altered. Calling ioctl() to re-read partition table. Syncing disks.`

Finally, we can format the partitions.

`$ sudo mkfs.vfat -n "BOOT" /dev/sdb1 mkfs.fat 4.2 (2021-01-31) $ sudo mkfs.ext4 -L "ROOTFS" /dev/sdb2 mke2fs 1.46.5 (30-Dec-2021) Creating filesystem with 7371264 4k blocks and 1843200 inodes Filesystem UUID: 14b83a0a-5ef2-493a-bcd0-a089cbec1570 Superblock backups stored on blocks: 32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632, 2654208, 4096000 Allocating group tables: done Writing inode tables: done Creating journal (32768 blocks): done Writing superblocks and filesystem accounting information: done`

If you encounter problems booting, check the size of the SD card. Sometimes platforms need smaller SD cards (16 GB/32 GB should definitely work).

An easier way is to use the script provided by[Chris Simmonds](https://github.com/csimmonds/embedded-linux-quick-start-files/blob/master/format-sdcard.sh?source=post_page-----8194fa4c59c3--------------------------------).

# Preparing the U-Boot scripts

To set up the TFTP boot on our target, we’ll use U-Boot scripts. The first one, we’ll call boot.scr. It’ll be responsible to set up the TFTP client and get our next script.

Let’s create a new folder and create a file named boot.source.

`$ mkdir bootscripts && cd $_ $ vim boot.source setenv fileaddr 0xc00000 fatload mmc 0:1 ${fileaddr} uEnv.txt setenv autoload no dhcp env import -t ${fileaddr} tftpb ${fileaddr} tftp.scr source ${fileaddr}`

This script will load a file called uEnv.txt, get an IP address through DHCP, and get tftp.scr from our TFTP server.

The file uEnv.txt just provides the IP of our server, the TFTP port, and the NFS path.

`$ vim uEnv.txt serverip=192.168.0.241 tftpdstp=6900 nfspath=/home/<user>/nfs/`

Next, the tftp.scr script will load our image and set the boot arguments for NFS boot.

`$ vim tftp.source tftpb ${kernel_addr_r} Image setenv bootargs root=/dev/nfs rw rootwait console=tty1 console=ttyAMA0,115200 nfsroot=${serverip}:${nfspath},tcp,v3 ip=${ipaddr} booti ${kernel_addr_r} - ${fdt_addr}`

Important to notice:

The device tree (DT) could also be loaded through TFTP, but the Raspberry Pi bootloader makes changes to the DT while applying overlays. This leads to problems while using U-Boot. Therefore, we’ll let the RPI bootloader handle this 😅. More can be found[here](https://forums.raspberrypi.com/viewtopic.php?t=314502).

The DT is located at fdt\_addr, so we’ll use it to boot.

To enable NFS boot, we should provide ‘,tcp,v3’. Without it, we can encounter problems (Described[here](https://raspberrypi.stackexchange.com/questions/48350/nfsroot-boot-fails-nfs-server-reports-the-request)). When we disable NFS version 2 it works either way.

Finally, we can compile the scripts. If we don’t have the U-Boot tools already, let’s install them real quick:

`$ sudo apt install u-boot-tools`

Then run:

`$ mkimage -T script -A arm64 -C none -a 0x2400000 -e 0x2400000 -d boot.source boot.scr Image Name: Created: Sat May 13 20:19:55 2023 Image Type: AArch64 Linux Script (uncompressed) Data Size: 166 Bytes = 0.16 KiB = 0.00 MiB Load Address: 02400000 Entry Point: 02400000 Contents: Image 0: 158 Bytes = 0.15 KiB = 0.00 MiB $ mkimage -A arm64 -T script -C none -a 0xC00000 -e 0xC00000 -d tftp.source tftp.scr Image Name: Created: Sat May 13 17:48:39 2023 Image Type: AArch64 Linux Script (uncompressed) Data Size: 203 Bytes = 0.20 KiB = 0.00 MiB Load Address: 00c00000 Entry Point: 00c00000 Contents: Image 0: 195 Bytes = 0.19 KiB = 0.00 MiB`

An easy way to get a sense of the RAM addresses we can use is to copy the sdcard.img with ‘dd’ and interrupt the boot. Then we can use

`U-Boot> printenv`

to print the environment and snoop through the load addresses.

# Prepare the SD card

Let’s mount the SD card.

`$ sudo mount /dev/sdb1 /mnt/boot`

Now we can copy the files onto the card.

`$ sudo cp ~/rpi4/buildroot/images/u-boot.bin /mnt/boot/ $ sudo cp ~/rpi4/buildroot/images/bcm2711-rpi-4-b.dtb /mnt/boot/ $ sudo cp -R ~/rpi4/buildroot/images/rpi-firmware/* /mnt/boot/ $ sudo rm /mnt/boot/cmdline.txt $ sudo cp ~/rpi4/bootscripts/boot.scr ~/rpi4/bootscripts/uEnv.txt /mnt/boot/`

Next, we’ve to edit the config.txt file and unmount the SD card.

`$ sudo vim /mnt/boot/config.txt kernel=u-boot.bin enable_uart=1 # If not already set arm_64bit=1 $ sudo umount /mnt/boot`

# Prepare the NFS directory

Let’s extract the root filesystem into the shared folder.

`sudo tar -C /home/${USER}/nfs -xf ~/rpi4/build/images/rootfs.tar`

To prevent ownership problems, we’ll change it to root.

`$ sudo chown -R 0:0 ~/nfs/*`

# Prepare the TFTP directory

To reduce the amount of copying into the TFTP folder, we can use hard links to reference the files. This way we can change files and at the next boot the new version will be used. Important to remember is that symlinks aren’t supported.

`$ cd ~/tftp $ cp ../rpi4/build/images/Image . $ cp ../rpi4/bootscripts/tftp.scr . $ ln ../rpi4/bootscripts/uEnv.txt .`

One draw back, the hard link gets removed when the link or the source is deleted. This also happens if, during editing or regeneration, the old source file is removed. In such a case, unpleasant surprises may occur. Let’s take a look at a quick example:

`$ touch source.txt # The ls -l command shows the number of hard links (here the 1 or 2 respectivly) $ ls -l -rw-rw-r-- 1 fp fp 0 May 15 14:10 source.txt # Now we're creating a hard link $ ln source.txt link.txt # And the counter is increased $ ls -l -rw-rw-r-- 2 fp fp 0 May 15 14:10 link.txt -rw-rw-r-- 2 fp fp 0 May 15 14:10 source.txt # Editing the file changes the also the link content $ echo "Text" > source.txt $ cat link.txt Text # Even when the source is removed, we've still access to the content $ rm source.txt # E.g. a script removing and recreating a file could make us belief there is still a hard link $ touch source.txt $ cat link.txt Text # But the hard link counter is reduced $ ls -l -rw-rw-r-- 1 fp fp 5 May 15 14:13 link.txt`

Therefore, check your files and if it’s not suitable, just copy it.

# Connect the RPI

The UART pins to use are GPIO (14/15) 8/10 and 6 for the ground. Connecting the USB-UART converter, we have to cross-connect TX and RX. Also, we have to connect Ethernet and power.

![](https://bytesandweb.pl/wp-content/uploads/2024/10/image-7.png)One thing that isn’t taken into account in this article is the separation between the target and the general network. This could be achieved with a separate network interface or a virtual network.

# Let’s boot …

Next, establish a serial connection via a program like picocom:

`$ picocom -b 115200 /dev/ttyUSB0`

After powering on our Raspberry Pi we should receive the logs shown below.

`... TFTP from server 192.168.0.241; our IP address is 192.168.0.66 Filename 'tftp.scr'. Load address: 0xc00000 Loading: ################################################## 267 Bytes 51.8 KiB/s done Bytes transferred = 267 (10b hex) ## Executing script at 00c00000 Using ethernet@7d580000 device TFTP from server 192.168.0.241; our IP address is 192.168.0.66 Filename 'Image'. Load address: 0x80000 Loading: ################################T T ################## 20.7 MiB 1.7 MiB/s done Bytes transferred = 21658112 (14a7a00 hex) Moving Image from 0x80000 to 0x200000, end=17f0000 ## Flattened Device Tree blob at 2eff2e00 Booting using the fdt blob at 0x2eff2e00 Working FDT set to 2eff2e00 Using Device Tree in place at 000000002eff2e00, end 000000002f002fa1 Working FDT set to 2eff2e00 Starting kernel ... ... [ 7.037589] device=eth0, hwaddr=e4:5f:01:7a:84:ae, ipaddr=192.168.0.66, mask=255.255.255.0, gw=255.255.255.255 [ 7.048053] host=192.168.0.66, domain=, nis-domain=(none) [ 7.053911] bootserver=255.255.255.255, rootserver=192.168.0.241, rootpath= [ 7.054985] uart-pl011 fe201000.serial: no DMA platform data [ 7.077101] VFS: Mounted root (nfs filesystem) on device 0:17. [ 7.083500] devtmpfs: mounted [ 7.093540] Freeing unused kernel memory: 3648K [ 7.121371] Run /sbin/init as init process Starting syslogd: OK Starting klogd: OK Running sysctl: OK Seeding 2048 bits without crediting Saving 2048 bits of non-creditable seed for next boot Starting network: ip: RTNETLINK answers: File exists Skipping eth0, used for NFS from 192.168.0.241 Welcome to Buildroot`

We did it!!!

[via GIPHY](https://giphy.com/gifs/retro-thumbs-up-XreQmk7ETCak0)

Let’s quickly test our NFS partition. Let’s boot our board and create a new file on our host

`$ cd ~/nfs $ sudo touch test.txt`

and verify it on our target.

`# ls / bin lib media proc sbin var dev lib64 mnt root sys tmp etc linuxrc opt run test.txt usr`

As we can see, we are now able to exchange and edit files without touching the SD card.

# Last thoughts

Through the use of two U-Boot scripts, we can easily apply changes to the second one, without the need to change the SD card content. In case we need to modify the uEnv.txt we can of course copy it on the card or use TFTP and some U-Boot magic 😀. Let’s add ‘test 1’ to our uEnv.txt, load it from our host, and save it to the boot partition.

`... U-Boot> tftpb 0xc00000 uEnv.txt Using ethernet@7d580000 device TFTP from server 192.168.0.241; our IP address is 192.168.0.66 Filename 'uEnv.txt'. Load address: 0xc00000 Loading: ################################################## 65 Bytes 12.7 KiB/s done Bytes transferred = 65 (41 hex) U-Boot> save mmc 0:1 ${fileaddr} uEnv.txt ${filesize} 65 bytes written in 27 ms (2 KiB/s) U-Boot> setenv fileaddr 0xc00000 U-Boot> fatload mmc 0:1 ${fileaddr} uEnv.txt 65 bytes read in 9 ms (6.8 KiB/s) U-Boot> env import -t ${fileaddr} ## Warning: Input data exceeds 1048576 bytes - truncated ## Info: input data size = 1048578 = 0x100002 U-Boot> printenv test test=1`

# Let’s recap …

In this article, we set up and configured a TFTP and NFS server. We build a Linux image, root filesystem, and bootloader using Buildroot. Then, we configured U-Boot to support network booting. Finally, we used it to boot a Raspberry Pi 4 over the network.

This approach is easily reproducible for other boards and can drastically reduce iteration times during development. Therefore, it’s worth the time to set it up 😀.

I hope you enjoyed it, and thanks for reading!

# Further reading 🙂

- Mastering Embedded Linux Programming – Third Edition — Frank Vasquez, Chris Simmonds
- [Boot Linux Kernel From NFS (NFSboot)-buildroot](https://ez.analog.com/cfs-filesystemfile/__key/communityserver-discussions-components-files/417/Boot-Linux-Kernel-From-NFS-_2800_NFSboot_29002D00_buildroot_2D00_v2_2D00_20200616_5F00_234604.pdf?_=637279626624460698)
