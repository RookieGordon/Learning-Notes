<%*
let courseName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
console.log(fileDirPath)
-%>
---
tags: <%courseName%>
course: <%courseName%>
fileDirPath: <%fileDirPath%>
type: Study
date_start: <%tp.date.now("YYYY-MM-DD")%>
date_finish: <%tp.date.now("YYYY-MM-DD")%>

---

![[DataView.components]]