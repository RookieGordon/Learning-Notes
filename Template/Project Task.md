<%*
// 获取项目名称
let filePath = tp.file.path(true)
let paths = filePath.split('/')
let projectName = paths[paths.length - 3]

let moduleName = tp.file.folder()
let taskName = tp.file.title
-%>
---
tags: <%projectName%>/<% moduleName %>/<% fileName %>
Project: <% projectName %>
date_start: <% tp.date.now("YYYY-MM-DD")%>
date_finish: <% tp.date.now("YYYY-MM-DD")%>

---



