(function(e){if(!e)return;function i(){if(typeof e.Swal=="undefined"){e.alert(`新教师上手引导：
1. 选择【届别】与【学期】
2. 导入成绩表
3. 导入任课表并同步
4. 选择本校
5. 进入教师画像查看结果`),e.localStorage.setItem("HAS_SEEN_STARTER","1");return}e.Swal.fire({title:"🧭 新教师上手引导",html:`
                <ol style="text-align:left; line-height:1.8; font-size:13px; color:#475569;">
                    <li>选择【届别】与【学期】</li>
                    <li>在“数据上传与设置”导入成绩表</li>
                    <li>在“教师任课”导入任课表并同步</li>
                    <li>选择本校</li>
                    <li>进入“教师教学质量画像”查看结果</li>
                </ol>
            `,confirmButtonText:"我知道了",confirmButtonColor:"#0ea5e9"}),e.localStorage.setItem("HAS_SEEN_STARTER","1")}e.openStarterGuide=i,e.StarterGuideRuntime={openStarterGuide:i}})(typeof window!="undefined"?window:globalThis);
