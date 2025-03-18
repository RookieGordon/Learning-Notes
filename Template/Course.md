<%*
let courseName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
-%>
---
tags: <%courseName%>
course: <%courseName%>
fileDirPath: <%fileDirPath%>
type: Study
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>

---