<%*
// 获取项目名称
let fileDirPath = tp.file.folder(true);
let paths = fileDirPath.split('/');
let projectName = paths[paths.length - 2];
let moduleName = tp.file.folder();
let taskName = tp.file.title;
-%>
---
tags: <%projectName%>/<%moduleName%>/<%taskName%> mytodo
type: Project
project: <%projectName%>
projectType: Task
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
finished: false
displayIcon: pixel-banner-images/项目任务.png

---





