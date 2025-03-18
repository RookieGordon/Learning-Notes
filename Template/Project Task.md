<%*
// 获取项目名称
let filePath = tp.file.path(true)
let paths = filePath.split('/')
let projectName = paths[paths.length - 3]

let moduleName = tp.file.folder()
let taskName = tp.file.title
-%>
---
tags: <%projectName%>/<%moduleName%>/<%fileName%>
project: <%projectName%>
type: Project
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>

---





