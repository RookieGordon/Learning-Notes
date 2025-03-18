<%*
let courseName = tp.file.folder();
let courseDirPath = tp.file.folder(true);
-%>
---
tags: <%courseName%>
Course: <%courseName%>
type: Study
date_start: <%tp.date.now("YYYY-MM-DD")%>
date_finish: <%tp.date.now("YYYY-MM-DD")%>

---

![[DataView.components]]