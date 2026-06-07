# เว็บส่งงานคลิปวิชาวิทยาการคำนวณ ป.4/1

หน้าเว็บนี้มี 2 ส่วนในหน้าเดียว:

- นักเรียนกรอกเลขที่ ชื่อ และส่งคลิปขั้นตอนการต้มไข่
- ครูดูรายชื่อผู้ส่งงาน เปิดคลิปในห้อง ทำเครื่องหมายว่านำเสนอแล้ว และส่งออก CSV

## วิธีเปิดใช้งานหน้าเว็บ

เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์ได้ทันที

## วิธีให้อัปโหลดลง Google Drive ได้โดยตรง

1. เปิดโปรเจกต์ Apps Script:
   `https://script.google.com/u/0/home/projects/1ghkBj6t5Oe949dPB7oHhvE2SsQdEeEVH8LeQV34fdr7O_zS55a22UrfT/edit`
2. คัดลอกโค้ดจาก `apps-script/Code.gs` ไปวางแทนโค้ดเดิมใน Apps Script
3. กด `Deploy` > `New deployment`
4. เลือกชนิดเป็น `Web app`
5. ตั้งค่า:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. กด `Deploy` แล้วอนุญาตสิทธิ์ Google Drive
7. คัดลอก Web app URL ที่ลงท้าย `/exec`
8. กลับมาที่หน้าเว็บ กด `ตั้งค่า URL ระบบอัปโหลดของครู` แล้ววาง URL นั้น หากต้องการเปลี่ยนจาก URL ที่ตั้งไว้แล้ว

URL ที่ตั้งเป็นค่าเริ่มต้นในเว็บนี้:

`https://script.google.com/macros/s/AKfycbzCJb7ZIyPJXsJ4YK8Fzp_TjxdeLPnSwSTzocdsyFpc_yIEzNsOn2gd-1zHckfW7tDw/exec`

หลังตั้งค่าแล้ว นักเรียนสามารถเลือกไฟล์วิดีโอและส่งงานได้โดยตรง ไฟล์จะถูกอัปโหลดเข้าโฟลเดอร์ Google Drive:

`https://drive.google.com/drive/folders/1gksEfcJGqgyHpC4zYco_ySL25vX7COIS?usp=drive_link`

## หมายเหตุ

- ถ้าไฟล์ใหญ่เกิน 45 MB ให้ใช้โหมด `วางลิงก์ Drive`
- ข้อมูลรายชื่อในหน้าเว็บเก็บไว้ใน `localStorage` ของเบราว์เซอร์เครื่องที่เปิดใช้งาน
- หากต้องการให้ข้อมูลรายชื่อกลางทุกเครื่อง ต้องเพิ่ม Google Sheet หรือฐานข้อมูลกลางใน Apps Script เพิ่มเติม
