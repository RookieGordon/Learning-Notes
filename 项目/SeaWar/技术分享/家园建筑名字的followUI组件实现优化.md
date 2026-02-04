## FollowUI实现机制导致的问题：

1. 每帧update-batch的消耗
    
      拖动屏幕导致followUI的组件因为位置信息变动，会频繁Rebatch，cpu耗时会增加不少
    

PC UnityEditor上拖动家园场景建筑名字FollowUI的耗时

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ODNhNjI5YTUwZmE4YTdjNTMyMWY2M2ViYjJlODAwYTBfOHc5bklWSHZmSndSOHhvSkxaZGlFZ0l5bkx2Q1p6cnBfVG9rZW46V0JtcmJNRW95bzFpZVh4bjVERWNEY0w0bnNiXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWM1N2I0ZDI3ZTNmNmUwN2I3NTkwMjMxYzNlNjFkNGVfT2VSd1dRZjYzSUZkbFIxWXVwdm51WlZaWjFMd1h6MzlfVG9rZW46VURrbGJPelh4bzJ1ZHF4aGZTeWNSTEJlblZLXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

Mix2手机上的耗时

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZTliN2UxY2VjMTk5YWY2ZWNkYjdmZDc2MzlkNmQ4YmRfcFFicVh4bDhNR0VTZjV6WHFwU29CdE9WdjBKNENhN1ZfVG9rZW46Q1Z3cmJwMVExb0lJN0l4OXNQR2NmM1N4bnI5XzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MmY4YjI3YmI5NzBiYjgyYTQ0MGM0MjYwNTZhNzg0OWNfMXQ0cmNFTjdWTk5HeFFLVkZBOURObXU3aFphM0gxd3BfVG9rZW46T3M0TGJVaW1Wb2p1cjd4TzlESWNidHl4bmNjXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

三星A32的耗时

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZTYzY2E5Yjc0YzcyYmVlMzNiYWQ2MzY2N2Q1NzFkNTZfenFpb1FJNDRJSWVkN1c0b2VWNFhRSHQybnAxZFY1ZUxfVG9rZW46VGNHNGJOdmVib09rWFF4Ykd2dWNDcjAybnBkXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MzcxMGU4NTFhMGNhMDcyNmFkY2VhYTU4MTQwMzQwMTBfekJhZ1BzVjlSQUNnaVlBOHZoWmp1YXo5RTRsZGFTc3ZfVG9rZW46QW1Zd2JWY0lnbzFTS2d4RGFIWmNGUGNObkpmXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

下面是ui部分的耗时，红框部分就是移动镜头时产生的波峰

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YmJlNjNmYzM5NDA3YzUyYWEyNjcyM2NkNjdlMjJlZGFfZmJUbGJTZ2JlRTV4cXpHZkVGcjh3QlJWT0FSd2tHWDVfVG9rZW46TVBCaWJ5eTlGb1M0Mkl4dzZYTGNTR2VqbkZkXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NzJkYWY4NDdkNzg0NzJiYTZjYmEzN2NjYjAyNmQ3MDBfOFhUaHltVEFPSkNhSzVNTzk2MG91T0llN0M1cW1FcVJfVG9rZW46QmxhRWJnYmVnb2NwWnF4OFE1Y2NWWUdqbjhlXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

2. Drawcall问题
    
      下面是拖动前后的对比
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YWRjODU0MDdmZGQzZDJlNDQyMjlkMDc3OGYxMmQ4NzhfWXpOOWRzMlBvbVRva21nNHdTb3ExbzBtT3FOc0pTVk9fVG9rZW46QXNTTWJLbHplb2tqMWp4QXFBQ2NDSXlrbjhlXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MjQ4ODhjMDlmY2E4YjJmYmQ1OTkxZTJiNzI2Y2NiZTNfVGxCeWJPaFhHWXJGRXpVejJia0kzQ0FpVGxwV1p4czlfVG9rZW46RmdOWmJwdTZGb0o4cld4Q2IzSGNYV2JybkMwXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

为什么会增加这么多，由于目前项目的ui方案是Screen Space-overlay模式，这导致了cpu阶段的视锥体剔除并不会发生，且followUI的canvas并没有限制边界，这导致了很多屏幕外的ui组件依然会走渲染流程，数量有多少就渲染多少。

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MzgzZTFkOWU0NWU3ZmRkMTM1Yzg0YjhlOWJlODA5ZDdfbkI5RnBaODdNS0kyVElQWDduUFF0cVpWV3NOY1pPOG9fVG9rZW46SnY1NGJtRVQwb1dOVTF4RE5BVWM5QURqbmcyXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MWQzOTQwYTZhOGVmNGFjNDg2ODkyMWM2MzA3YjU5ZWZfZGxpbTc3aW1WN2QyVFZacllNYzNLS0wzemxvSlRZZjNfVG9rZW46R0dTaWJvUnZHb2FEMkd4UFM0d2NrSWJ2bkFoXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

以上两点就决定了，ui rebatch的高cpu耗时+多drawcall带来的渲染成本，**followui方案天然不适合数量多的同功能类型的ui组件**。

  

## 新方案

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YmIyOTY5MTViNDM2YjkwMmY1OGUwOGY1YWE2ODk0MmFfTTZPZWhGckNhYWpzVjBrTHFvdVpIVktwcXJUY2NGcUlfVG9rZW46TUhUaWIxd3BYb3JRcm14RGlzYmNXa3h5bnpkXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

家园目前数量多的是建筑的名字，数量顶峰时是16个模拟经营建筑+20多个slg类型的建筑，每个name分别是背景+文字2个drawcall。

  

新方案介绍

1. 将该名字组件改为3d化 + Billboard，背景用spriteRenderer, 文字用MeshRenderer+TMP，放场景中进行渲染，这样能够先让视锥体剔除排除掉部分不需要渲染的内容。
    
2. 该组件由于是3d化的，所以肯定会发生与建筑穿插或者被建筑遮挡，这就要求背景和文字材质渲染顺序必须放最前（followui方案也是放最前），所以这2个材质需要用Ztest Alway的shader，故新增Distance Field_ZTest Alway.shader和修改SpritesTopZtestAlways.shader取spriteRenderer组件颜色。
    
3. 背景spriteRenderer的sort order 与文字（MeshRenderer+TMP）的sort order 分开，避免穿插。
    
4. 由于是spriteRenderer + MeshRenderer，能正常合批，英文环境下，拖动时只会增加2个drawcall。
    
5. 由于需要保证该名字不会随镜头高度变化，需要加入FollowObjKeepScale, 在update里更新localscale。
    
6. 新增SpriteAutoAdpativeBgByTexts，保证SpriteRenderer的size自适应文字长度。
    
7. 新增TMP_SDF-Mobile_ZTestAlway.shader，来支持ZTestAlway
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=OTNiMDFiMjZhMTg4YTRiZDI2YTYwZDM0ZTdmOGI2YjBfcm9LOTB4YUtxZFl6WXRGbzQ5NEh6ckdVTTU5dlNabjNfVG9rZW46Q3phbGJoWEF5b1JiSzd4RFhmRWNVQlZMbk9mXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

  

实现后拖动镜头，ui的batch消耗就不存在了，

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MDliYjY4MDc2NzE3MjhmMGJiM2E0NTAxMmNhODQ1YTFfaUNma01GR1lrSkJEdWZ2d01kMUVTdjhwdXVsVTFaZnFfVG9rZW46TWZ3TWJISlRJb3NLRTl4TUVnRWN2c3lubmNkXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWE5NzgyMjE3NDJjOGM0MzI1ZWVkY2M5NGE5YmQwN2RfWERHeWd5cnlOSGtxQTNPSXluVWdkYWFDdmMzSTVTeHJfVG9rZW46VDRUeGJ4TFZJb3hXQ0h4WVZUbGMyN2k4bndoXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

  

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YWUyMTQ2MjM0MTYwNzM5ZjA0NDYyMzZiNDlkMWQzMWVfVDVtTElHbnNNMWxRYlQ4T2lsSTN4ZnVEWkVXZ040RElfVG9rZW46R2JDMWJDWDEwb1J4c1l4REVWM2NPUnZWbm5lXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

该方案的英文语言下，drawcall只有2个。

  

  

  

  

  

  

## 发现的问题：

中文字符情况下，因为TMP Fallback到不同字体库中，导致多了很多Drawcall

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=OWU4OWU2NzlmYWQyMjdmNzc1M2YzNmMxYjFmZDFjYWRfMnl5YzQ3THU1akxaMlBjamZDMlF2NUNORWZ1UUV2QUFfVG9rZW46SmNhRWJDMU9Tb2xNV3h4NE44M2NvcXFpbnNmXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NDY2OGQyNjJjODVlZDgyMzQyZWU2ZjY1MTM2YTRmZjVfS3ZISkVYdlVrdUN0dzloNlFCUWd2d0JPVnZIZ3padXZfVG9rZW46SFM2VWJXTUpFb2h3RGd4MHFWb2NHeEZMbnFmXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

若是英文的情况下，只有2个Drawcall

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MGZjZGI4YmIxMzYyNWI0Y2Y0OTA1N2U3ODVjYTAwODBfQ3dMVDZSczJoZ0ZmUUQ4NzB4NDFqdElYNFEwbmhxbndfVG9rZW46WkZHdmJraDZab3BXVld4eVR1NmM2V1dlblJkXzE3NzAxODkxMTQ6MTc3MDE5MjcxNF9WNA)

这不只是followUI存在中文字体由于字体fallback导致多drawcall的问题，正常ui界面会也有。

  

继续优化的思路：

1. FollowObjKeepScale是每个组件自己update里做的，这里可以提出来放mgr里统一做，并用job+burst加速。