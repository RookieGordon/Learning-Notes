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
type: Study
course: <%projectName%>
courseType: Section
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
finished: false
banner: Study
displayIcon: pixel-banner-images/章节任务.png

---
# 代办事项列表
TODO
# 相关笔记




