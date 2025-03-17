<%*
let d = tp.date.now()
let folderName = tp.file.folder()
let filePath = tp.file.path(true)
let lastIdx = filePath.indexOf()
let fileName = tp.file.title
-%>
---
tags: Project/Task
Project: <% folderName %>
date_start: <% tp.date.now("YYYY-MM-DD")%>
date_finish: <% tp.date.now("YYYY-MM-DD")%>

---

# <% fileName %>模块设计思路

# 子任务列表

