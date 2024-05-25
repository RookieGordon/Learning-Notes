---
tags:
  - Unity
  - URP
  - Shader
annotation-target: Draw Calls.pdf
---
# Shaders

## Shader函数

>%%
>```annotation-json
>{"created":"2024-05-25T07:02:54.906Z","text":"一般来说，位置和纹理变量，使用float类型，其他则使用half类型即可","updated":"2024-05-25T07:02:54.906Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":8876,"end":9021},{"type":"TextQuoteSelector","exact":"he rule of thumb is to use float forpositions and texture coordinates only and half for everything else, provided that the results aregood enough","prefix":" use half as much as possible. T","suffix":".When not targeting mobile platf"}]}]}
>```
>%%
>*%%PREFIX%%use half as much as possible. T%%HIGHLIGHT%% ==he rule of thumb is to use float forpositions and texture coordinates only and half for everything else, provided that the results aregood enough== %%POSTFIX%%.When not targeting mobile platf*
>%%LINK%%[[#^2qgvqyy4vlr|show annotation]]
>%%COMMENT%%
>一般来说，位置和纹理变量，使用float类型，其他则使用half类型即可
>%%TAGS%%
>
^2qgvqyy4vlr

# 合批

