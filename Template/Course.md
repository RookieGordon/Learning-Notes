<%*
let projectName = tp.file.folder();
let fileDirPath = tp.file.folder(true);
let newComponentName = `${projectName}_CourseView`;
let vaultPath = tp.user.getVaultPath(tp.file.path(), tp.app.vault.getName());
tp.user.copyComponent(vaultPath, "CourseView", `${fileDirPath}/components`, newComponentName);
-%>
---
tags: <%projectName%> home
type: Study
course: <%projectName%>
courseType: Course
fileDirPath: <%fileDirPath%>
dateStart: <%tp.date.now("YYYY-MM-DD")%>
dateFinish: <%tp.date.now("YYYY-MM-DD")%>
cssclasses: editor-full

---
![[<%newComponentName%>.components]]