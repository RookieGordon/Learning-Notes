<%*
let fileDirPath = tp.file.folder(true);
let paths = fileDirPath.split('/');
let projDir = "";
for (let index = 0; index < paths.length - 1; index++) {
	const element = paths[index];
    projDir += element + '/';
}
let projectName = paths[paths.length - 2];
let moduleName = tp.file.title;
let newComponentName = `${projectName}_View`;
let vaultPath = tp.user.getVaultPath(tp.file.path(), tp.app.vault.getName());
tp.user.copyComponent(vaultPath, "ChapterView", `${projDir}/components`, newComponentName);
-%>
---
tags: <%projectName%>/<%moduleName%>
type: Study
course: <%projectName%>
courseType: Chapter
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
finished: false
cssclasses: editor-full

---

# <%moduleName%>章节学习目标
 *TODO*
 
# 任务列表
![[<%newComponentName%>.components]]


