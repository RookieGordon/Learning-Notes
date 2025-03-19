<%*
let fileDirPath = tp.file.folder(true);
let projectName = fileDirPath.split('/')[paths.length - 2];
let moduleName = tp.file.title;
-%>
---
tags: <%projectName%>/<%moduleName%>
type: Project
project: <%projectName%>
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
finished: false

---

# <%moduleName%>模块设计思路
 *TODO*
# 子任务列表


