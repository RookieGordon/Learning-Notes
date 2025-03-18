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
date_start: <%tp.date.now("YYYY-MM-DD")%>
date_finish: <%tp.date.now("YYYY-MM-DD")%>

---





