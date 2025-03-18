<%*
// 获取项目名称
let filePath = tp.file.path(true)
let paths = filePath.split('/')
let courseName = paths[paths.length - 3]

let chapterName = tp.file.folder()
let taskName = tp.file.title
-%>
---
tags: <%courseName%>/<%chapterName%>/<%fileName%>
course: <%courseName%>
type: Study
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>

---





