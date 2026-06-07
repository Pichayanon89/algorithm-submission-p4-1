# เว็บส่งงานคลิปวิชาวิทยาการคำนวณ ป.4/1

หน้าเว็บนี้มี 2 ส่วนในหน้าเดียว:

- นักเรียนกรอกเลขที่ ชื่อ-สกุล และส่งลิงก์คลิปจากช่องทางใดก็ได้
- ครูดูรายชื่อผู้ส่งงาน เปิดคลิปในห้อง ทำเครื่องหมายว่านำเสนอแล้ว และส่งออก CSV

## ระบบข้อมูลกลาง

รายชื่อผู้ส่งงานอ่านและบันทึกผ่าน Google Apps Script ลง Google Sheet นี้:

`https://docs.google.com/spreadsheets/d/1p4syLunOnujH1OOmBwNZKXTTV9f0Org9oTpAv0lQ9No/edit?gid=0#gid=0`

Web App URL ที่หน้าเว็บเรียกใช้งาน:

`https://script.google.com/macros/s/AKfycbzCJb7ZIyPJXsJ4YK8Fzp_TjxdeLPnSwSTzocdsyFpc_yIEzNsOn2gd-1zHckfW7tDw/exec`

## วิธีอัปเดต Apps Script

1. เปิดโปรเจกต์ Apps Script:
   `https://script.google.com/u/0/home/projects/1ghkBj6t5Oe949dPB7oHhvE2SsQdEeEVH8LeQV34fdr7O_zS55a22UrfT/edit`
2. คัดลอกโค้ดจาก `apps-script/ProductionCode.gs` ไปวางแทนโค้ดเดิมใน Apps Script
3. กด `Deploy` > `Manage deployments`
4. เลือก Deployment เดิม แล้วกดไอคอนแก้ไข
5. เลือก Version เป็น `New version`
6. กด `Deploy` และอนุญาตสิทธิ์ Google Sheets หากระบบถาม

หลัง Deploy แล้ว หน้าเว็บ GitHub Pages จะอ่านรายชื่อจาก Google Sheet กลาง และนักเรียนที่ส่งงานจากมือถือ/คอมพิวเตอร์จะเห็นรายชื่อร่วมกัน

## หมายเหตุ

- นักเรียนสามารถวางลิงก์จาก Google Drive, YouTube, Facebook หรือช่องทางอื่นได้
- ต้องตั้งค่าลิงก์ให้ครูเปิดดูได้ก่อนส่งงาน
- `localStorage` ใช้เป็นแคชสำรองชั่วคราวเท่านั้น ข้อมูลหลักอยู่ใน Google Sheet
