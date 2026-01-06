module.exports=[51463,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(50944),e=a.i(38246),f=a.i(210),g=a.i(60246),h=a.i(92258),i=a.i(8406),j=a.i(41710),k=a.i(92759),l=a.i(33508),m=a.i(96221),n=a.i(14548),o=a.i(77156),p=a.i(16201),q=a.i(70106);let r=(0,q.default)("target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]),s=(0,q.default)("smile",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);var t=a.i(4720);let u=(0,q.default)("gift",[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]]);var v=a.i(69520),w=a.i(99464);function x({isOpen:a,title:c,message:d,onConfirm:e,onCancel:f,confirmText:g="はい",cancelText:h="いいえ",isLoading:i=!1}){return a?(0,b.jsx)("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:(0,b.jsxs)("div",{className:"bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl",children:[(0,b.jsx)("h3",{className:"text-lg font-bold mb-2",children:c}),(0,b.jsx)("div",{className:"text-gray-600 mb-6",children:d}),(0,b.jsxs)("div",{className:"flex justify-end gap-3",children:[(0,b.jsx)("button",{onClick:f,disabled:i,className:"px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50",children:h}),(0,b.jsxs)("button",{onClick:e,disabled:i,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2",children:[i&&(0,b.jsx)(m.Loader2,{className:"w-4 h-4 animate-spin"}),g]})]})]})}):null}function y({isOpen:a,title:c,message:d,onClose:e,buttonText:f="閉じる"}){return a?(0,b.jsx)("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:(0,b.jsxs)("div",{className:"bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-center",children:[(0,b.jsx)(p.CheckCircle,{className:"w-16 h-16 text-green-500 mx-auto mb-4"}),c&&(0,b.jsx)("h3",{className:"text-lg font-bold mb-2",children:c}),(0,b.jsx)("p",{className:"text-gray-600 mb-6",children:d}),(0,b.jsx)("button",{onClick:e,className:"px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",children:f})]})}):null}let z=[{id:"churn_prevention",name:"解約防止",icon:"🔥",description:"トライアル終了間近のユーザーへ",subject:"【起業の科学ポータル】トライアル期間終了のお知らせ",body:`{{name}}様

いつも起業の科学ポータルをご利用いただきありがとうございます。

トライアル期間終了まで残り{{days_remaining}}日となりました。
この機会にぜひ有料会員へのアップグレードをご検討ください。

【有料会員の特典】
・全コンテンツへの無制限アクセス
・新着コンテンツの優先配信
・限定イベントへの参加権
・コミュニティへのアクセス

ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`},{id:"saa_benefits",name:"SAA特典",icon:"🎓",description:"アルムナイ向け特典案内",subject:"【起業の科学ポータル】SAAアルムナイ特典のご案内",body:`{{name}}様

SAAアルムナイとしてご登録いただきありがとうございます。

アルムナイ限定の特典をご案内いたします。

【アルムナイ特典】
・3ヶ月間の無料アクセス
・アルムナイ限定コンテンツ
・コミュニティイベントへの優先参加
・1on1メンタリングの割引

ぜひこの機会にポータルをご活用ください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`},{id:"new_content",name:"新着告知",icon:"📚",description:"新しいコンテンツのお知らせ",subject:"【起業の科学ポータル】新着コンテンツのお知らせ",body:`{{name}}様

起業の科学ポータルに新しいコンテンツが追加されました。

【今週の新着】
・動画: 「PMFを達成するための5つのステップ」
・記事: 「スタートアップの資金調達戦略」
・ケーススタディ: 「LayerXの成長戦略分析」

ぜひご覧ください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`},{id:"custom",name:"ゼロから",icon:"✨",description:"AIでゼロから生成",subject:"",body:""}],A=[{id:"urgent",label:"緊急感を出す",icon:r,color:"text-red-600 bg-red-50 hover:bg-red-100"},{id:"casual",label:"カジュアルに",icon:s,color:"text-yellow-600 bg-yellow-50 hover:bg-yellow-100"},{id:"formal",label:"丁寧に",icon:t.FileText,color:"text-blue-600 bg-blue-50 hover:bg-blue-100"},{id:"benefits",label:"特典を強調",icon:u,color:"text-green-600 bg-green-50 hover:bg-green-100"}];function B(){let a=(0,d.useSearchParams)(),p=(0,d.useRouter)(),q=a.get("userIds"),[r,s]=(0,c.useState)([]),[t,u]=(0,c.useState)(!0),[B,C]=(0,c.useState)(""),[D,E]=(0,c.useState)(""),[F,G]=(0,c.useState)("churn_prevention"),[H,I]=(0,c.useState)(!1),[J,K]=(0,c.useState)("immediate"),[L,M]=(0,c.useState)(""),[N,O]=(0,c.useState)("10:00"),[P,Q]=(0,c.useState)(""),[R,S]=(0,c.useState)(!1),[T,U]=(0,c.useState)(null),[V,W]=(0,c.useState)(null),[X,Y]=(0,c.useState)(!1),[Z,$]=(0,c.useState)(!1),[_,aa]=(0,c.useState)({isOpen:!1,title:"",message:"",nextAction:"users"}),[ab,ac]=(0,c.useState)(!1),[ad,ae]=(0,c.useState)(!1);(0,c.useEffect)(()=>{!async function(){if(!q)return u(!1);try{let a=await fetch("/api/admin/users");if(a.ok){let b=await a.json(),c=q.split(","),d=b.users.filter(a=>c.includes(a.id));s(d),d.length>0&&W(d[0])}}catch(a){console.error("Failed to fetch users:",a)}finally{u(!1)}}()},[q]),(0,c.useEffect)(()=>{let a=z.find(a=>a.id===F);a&&"custom"!==a.id?(C(a.subject),E(a.body),U(null)):a?.id==="custom"&&(C(""),E(""))},[F]);let af=(a,b)=>{var c;let d;return a.replace(/\{\{name\}\}/g,b.display_name||"お客様").replace(/\{\{email\}\}/g,b.email).replace(/\{\{days_remaining\}\}/g,String((c=b.trial_ends_at,d=new Date,Math.ceil((new Date(c).getTime()-d.getTime())/864e5)))).replace(/\{\{plan\}\}/g,"trial"===b.plan_type?"トライアル":"有料")},ag=async a=>{S(!0),U(a),await new Promise(a=>setTimeout(a,1200));let b=z.find(a=>a.id===F),c=B||b?.subject||"",d=D||b?.body||"";switch(a){case"urgent":c=c.replace("のお知らせ","【重要】残りわずか！"),d=`{{name}}様

【重要なお知らせ】

トライアル期間終了まで、あと{{days_remaining}}日です！

この期間を過ぎると、すべてのコンテンツにアクセスできなくなります。
今すぐ有料会員にアップグレードして、学びを継続しましょう。

▼ 今すぐアップグレード
https://portal.example.com/upgrade

【有料会員の特典】
・全300本以上の動画が見放題
・限定コミュニティへのアクセス
・月1回のオンラインイベント参加権

お見逃しなく！

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`;break;case"casual":c=`あと{{days_remaining}}日！起業の科学ポータルからのお知らせ 👋`,d=`{{name}}さん、こんにちは！

起業の科学ポータルをご利用いただきありがとうございます 🙏

トライアル期間があと{{days_remaining}}日で終了します。

もしポータルが役に立っているなら、ぜひ有料会員への切り替えをご検討ください！

有料会員になると...
✨ 全コンテンツが見放題に
✨ 限定コミュニティに参加できる
✨ 毎月のイベントに参加できる

わからないことがあれば、いつでも聞いてくださいね！

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`;break;case"formal":c="【起業の科学ポータル】トライアル期間終了に関するご案内",d=`{{name}}様

平素より起業の科学ポータルをご利用いただき、誠にありがとうございます。

さて、ご利用いただいておりますトライアル期間が、{{days_remaining}}日後に終了いたします。

つきましては、引き続きサービスをご利用いただける有料会員プランへのお切り替えをご検討いただけますと幸いです。

【有料会員プランの特典】
・全コンテンツへの無制限アクセス
・新着コンテンツの優先配信
・限定イベントへのご招待
・会員専用コミュニティへのアクセス

ご不明な点がございましたら、お気軽にお問い合わせくださいませ。

今後とも起業の科学ポータルをよろしくお願い申し上げます。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル運営事務局
━━━━━━━━━━━━━━━━━━━━━━`;break;case"benefits":c="【起業の科学ポータル】有料会員の特典をご紹介 🎁",d=`{{name}}様

起業の科学ポータルをご利用いただきありがとうございます。

トライアル期間終了まで残り{{days_remaining}}日となりました。
この機会に、有料会員になるとどんな特典があるかご紹介させてください！

━━━━━━━━━━━━━━━━━━━━━━
🎁 有料会員だけの5つの特典
━━━━━━━━━━━━━━━━━━━━━━

【特典1】全300本以上の動画が見放題
PMF達成、資金調達、チームビルディングなど、
起業に必要な知識を網羅した動画コンテンツにアクセスできます。

【特典2】限定コミュニティ
同じ志を持つ起業家仲間とつながれる
Slackコミュニティにご招待します。

【特典3】月1回のオンラインイベント
田所雅之による最新トレンド解説や
Q&Aセッションに参加できます。

【特典4】新着コンテンツの優先配信
新しい動画や記事をいち早くお届けします。

【特典5】1on1メンタリング割引
有料会員限定で、メンタリングを特別価格でご提供します。

━━━━━━━━━━━━━━━━━━━━━━

▼ 今すぐ有料会員になる
https://portal.example.com/upgrade

ご質問があれば、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
━━━━━━━━━━━━━━━━━━━━━━`}C(c),E(d),S(!1)},ah=async()=>{if(!P.trim())return;S(!0),await new Promise(a=>setTimeout(a,1500));let a=`【起業の科学ポータル】${P.slice(0,15)}...`,b=`{{name}}様

いつも起業の科学ポータルをご利用いただきありがとうございます。

${P}

【ご案内】
トライアル期間は残り{{days_remaining}}日です。
ぜひこの機会に有料会員へのアップグレードをご検討ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
起業の科学ポータル
https://portal.example.com
━━━━━━━━━━━━━━━━━━━━━━`;C(a),E(b),S(!1),Q(""),U("custom")},ai=async()=>{ac(!0),await new Promise(a=>setTimeout(a,1500)),ac(!1),Y(!1),aa({isOpen:!0,title:"送信完了",message:"メールを送信しました。",nextAction:"emails"})},aj=async()=>{ae(!0),await new Promise(a=>setTimeout(a,1e3)),ae(!1),$(!1),aa({isOpen:!0,title:"保存完了",message:"下書きを保存しました。メール管理画面から確認できます。",nextAction:"emails"})},ak=r.length>0&&B&&D,al=B||D;return t?(0,b.jsx)("div",{className:"min-h-screen bg-gray-50 flex items-center justify-center",children:(0,b.jsx)(m.Loader2,{className:"w-8 h-8 animate-spin text-blue-500"})}):(0,b.jsxs)("div",{className:"min-h-screen bg-gray-50",children:[(0,b.jsx)("div",{className:"bg-white border-b sticky top-0 z-10",children:(0,b.jsxs)("div",{className:"max-w-7xl mx-auto px-4 py-4 flex items-center justify-between",children:[(0,b.jsxs)("div",{className:"flex items-center gap-4",children:[(0,b.jsxs)(e.default,{href:"/admin/email",className:"text-gray-500 hover:text-gray-700 flex items-center gap-1",children:[(0,b.jsx)(f.ArrowLeft,{className:"w-5 h-5"}),(0,b.jsx)("span",{className:"text-sm",children:"メール管理に戻る"})]}),(0,b.jsx)("h1",{className:"text-xl font-bold",children:"メール作成"})]}),(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsxs)("button",{onClick:()=>{(B||D)&&$(!0)},disabled:!al,className:"px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",children:[(0,b.jsx)(n.Save,{className:"w-4 h-4"})," 下書き保存"]}),(0,b.jsxs)("button",{onClick:()=>{0!==r.length&&B&&D&&Y(!0)},disabled:!ak,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",children:[(0,b.jsx)(k.Send,{className:"w-4 h-4"}),"immediate"===J?"送信確認":"スケジュール設定"]})]})]})}),(0,b.jsx)("div",{className:"max-w-7xl mx-auto px-4 py-6",children:(0,b.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[(0,b.jsxs)("div",{className:"space-y-6",children:[(0,b.jsxs)("div",{className:"bg-white rounded-lg border p-4",children:[(0,b.jsx)("div",{className:"flex items-center justify-between mb-3",children:(0,b.jsxs)("h2",{className:"font-medium flex items-center gap-2",children:[(0,b.jsx)(g.Users,{className:"w-4 h-4 text-gray-500"}),"宛先 (",r.length,"人)"]})}),0===r.length?(0,b.jsxs)("div",{className:"text-center py-4",children:[(0,b.jsx)("p",{className:"text-gray-500 text-sm mb-2",children:"ユーザーが選択されていません"}),(0,b.jsx)(e.default,{href:"/admin/users",className:"text-blue-600 text-sm hover:underline",children:"ユーザー管理画面で選択する →"})]}):(0,b.jsx)("div",{className:"space-y-2 max-h-32 overflow-y-auto",children:r.map(a=>(0,b.jsxs)("div",{className:`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${V?.id===a.id?"bg-blue-50 border border-blue-200":"bg-gray-50 hover:bg-gray-100"}`,onClick:()=>W(a),children:[(0,b.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,b.jsx)("div",{className:"text-sm font-medium truncate",children:a.display_name||"(名前未設定)"}),(0,b.jsx)("div",{className:"text-xs text-gray-500 truncate",children:a.email})]}),(0,b.jsxs)("div",{className:"flex items-center gap-2 ml-2",children:[(a=>{switch(a){case"high":return(0,b.jsx)("span",{className:"text-xs text-red-600",children:"🔴高"});case"medium":return(0,b.jsx)("span",{className:"text-xs text-yellow-600",children:"🟡中"});case"low":return(0,b.jsx)("span",{className:"text-xs text-green-600",children:"🟢低"});default:return null}})(a.churnRisk),(0,b.jsx)("button",{onClick:b=>{var c;let d;b.stopPropagation(),c=a.id,s(d=r.filter(a=>a.id!==c)),V?.id===c&&d.length>0&&W(d[0])},className:"p-1 hover:bg-gray-200 rounded",children:(0,b.jsx)(l.X,{className:"w-3 h-3 text-gray-400"})})]})]},a.id))})]}),(0,b.jsxs)("div",{className:"bg-white rounded-lg border p-4",children:[(0,b.jsxs)("h2",{className:"font-medium mb-3 flex items-center gap-2",children:[(0,b.jsx)("span",{className:"bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded",children:"1"}),"テンプレートを選択"]}),(0,b.jsx)("div",{className:"grid grid-cols-4 gap-2",children:z.map(a=>(0,b.jsxs)("button",{onClick:()=>G(a.id),className:`p-3 rounded-lg border text-center transition ${F===a.id?"border-blue-500 bg-blue-50":"border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`,children:[(0,b.jsx)("div",{className:"text-2xl mb-1",children:a.icon}),(0,b.jsx)("div",{className:"text-xs font-medium",children:a.name})]},a.id))}),F&&(0,b.jsx)("p",{className:"text-xs text-gray-500 mt-2",children:z.find(a=>a.id===F)?.description})]}),(0,b.jsxs)("div",{className:"bg-white rounded-lg border p-4",children:[(0,b.jsxs)("h2",{className:"font-medium mb-3 flex items-center gap-2",children:[(0,b.jsx)("span",{className:"bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded",children:"2"}),(0,b.jsx)(i.Sparkles,{className:"w-4 h-4 text-purple-500"}),"AIで調整（オプション）"]}),(0,b.jsx)("div",{className:"flex flex-wrap gap-2 mb-4",children:A.map(a=>(0,b.jsxs)("button",{onClick:()=>ag(a.id),disabled:R,className:`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition ${a.color} ${T===a.id?"ring-2 ring-offset-1 ring-blue-400":""} disabled:opacity-50`,children:[(0,b.jsx)(a.icon,{className:"w-3.5 h-3.5"}),a.label]},a.id))}),(0,b.jsxs)("div",{className:"flex gap-2",children:[(0,b.jsx)("input",{type:"text",value:P,onChange:a=>Q(a.target.value),placeholder:"または自由に指示... 例: 「もっと短くして」「絵文字を追加」",className:"flex-1 px-3 py-2 border rounded-lg text-sm",onKeyDown:a=>{"Enter"===a.key&&P.trim()&&ah()}}),(0,b.jsxs)("button",{onClick:ah,disabled:R||!P.trim(),className:"px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1.5 text-sm",children:[R?(0,b.jsx)(m.Loader2,{className:"w-4 h-4 animate-spin"}):(0,b.jsx)(i.Sparkles,{className:"w-4 h-4"}),"調整"]})]}),T&&(0,b.jsxs)("button",{onClick:()=>{let a=z.find(a=>a.id===F);a&&(C(a.subject),E(a.body),U(null))},className:"mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1",children:[(0,b.jsx)(v.RefreshCw,{className:"w-3 h-3"})," テンプレートに戻す"]})]}),(0,b.jsxs)("div",{className:"bg-white rounded-lg border p-4",children:[(0,b.jsxs)("h2",{className:"font-medium flex items-center gap-2 mb-3",children:[(0,b.jsx)(h.Mail,{className:"w-4 h-4 text-gray-500"}),"件名"]}),(0,b.jsx)("input",{type:"text",value:B,onChange:a=>C(a.target.value),placeholder:"メールの件名を入力...",className:"w-full px-3 py-2 border rounded-lg"})]}),(0,b.jsxs)("div",{className:"bg-white rounded-lg border p-4",children:[(0,b.jsxs)("div",{className:"flex items-center justify-between mb-3",children:[(0,b.jsxs)("h2",{className:"font-medium flex items-center gap-2",children:[(0,b.jsx)(w.Pencil,{className:"w-4 h-4 text-gray-500"}),"本文"]}),(0,b.jsx)("button",{onClick:()=>I(!H),className:`text-xs px-2 py-1 rounded ${H?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-600"}`,children:H?"編集中":"手動編集"})]}),H?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("textarea",{value:D,onChange:a=>E(a.target.value),placeholder:"メール本文を入力...",className:"w-full px-3 py-2 border rounded-lg h-64 resize-none font-mono text-sm"}),(0,b.jsxs)("div",{className:"mt-2 flex flex-wrap gap-2",children:[(0,b.jsx)("span",{className:"text-xs text-gray-500",children:"差し込み変数:"}),["{{name}}","{{email}}","{{days_remaining}}","{{plan}}"].map(a=>(0,b.jsx)("button",{onClick:()=>E(D+a),className:"px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200",children:a},a))]})]}):(0,b.jsx)("div",{className:"bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap h-64 overflow-y-auto",children:D||"(本文が未設定です)"})]}),(0,b.jsxs)("div",{className:"bg-white rounded-lg border p-4",children:[(0,b.jsxs)("h2",{className:"font-medium flex items-center gap-2 mb-3",children:[(0,b.jsx)(j.Clock,{className:"w-4 h-4 text-gray-500"}),"送信タイミング"]}),(0,b.jsxs)("div",{className:"space-y-3",children:[(0,b.jsxs)("label",{className:"flex items-center gap-2 cursor-pointer",children:[(0,b.jsx)("input",{type:"radio",name:"timing",checked:"immediate"===J,onChange:()=>K("immediate"),className:"text-blue-600"}),(0,b.jsx)("span",{children:"即時送信"})]}),(0,b.jsxs)("label",{className:"flex items-center gap-2 cursor-pointer",children:[(0,b.jsx)("input",{type:"radio",name:"timing",checked:"scheduled"===J,onChange:()=>K("scheduled"),className:"text-blue-600"}),(0,b.jsx)("span",{children:"スケジュール送信"})]}),"scheduled"===J&&(0,b.jsxs)("div",{className:"flex gap-2 ml-6",children:[(0,b.jsx)("input",{type:"date",value:L,onChange:a=>M(a.target.value),className:"px-3 py-1.5 border rounded-lg text-sm"}),(0,b.jsx)("input",{type:"time",value:N,onChange:a=>O(a.target.value),className:"px-3 py-1.5 border rounded-lg text-sm"})]})]})]})]}),(0,b.jsx)("div",{className:"lg:sticky lg:top-24 lg:self-start",children:(0,b.jsxs)("div",{className:"bg-white rounded-lg border overflow-hidden",children:[(0,b.jsxs)("div",{className:"bg-gray-50 border-b px-4 py-3 flex items-center justify-between",children:[(0,b.jsxs)("h2",{className:"font-medium flex items-center gap-2",children:[(0,b.jsx)(o.Eye,{className:"w-4 h-4 text-gray-500"}),"プレビュー",R&&(0,b.jsxs)("span",{className:"text-xs text-purple-600 flex items-center gap-1",children:[(0,b.jsx)(m.Loader2,{className:"w-3 h-3 animate-spin"})," 生成中..."]})]}),r.length>1&&V&&(0,b.jsx)("select",{value:V.id,onChange:a=>{let b=r.find(b=>b.id===a.target.value);b&&W(b)},className:"text-sm border rounded px-2 py-1",children:r.map(a=>(0,b.jsx)("option",{value:a.id,children:a.display_name||a.email},a.id))})]}),(0,b.jsx)("div",{className:"p-4",children:V?(0,b.jsxs)("div",{className:"border rounded-lg overflow-hidden",children:[(0,b.jsxs)("div",{className:"bg-gray-50 px-4 py-3 border-b space-y-1",children:[(0,b.jsxs)("div",{className:"text-sm",children:[(0,b.jsx)("span",{className:"text-gray-500",children:"To:"})," ",V.email]}),(0,b.jsxs)("div",{className:"text-sm",children:[(0,b.jsx)("span",{className:"text-gray-500",children:"Subject:"})," ",(0,b.jsx)("span",{className:"font-medium",children:B?af(B,V):"(件名未入力)"})]})]}),(0,b.jsx)("div",{className:"p-4 bg-white max-h-[500px] overflow-y-auto",children:(0,b.jsx)("pre",{className:"whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed",children:D?af(D,V):"(本文未入力)"})})]}):(0,b.jsx)("div",{className:"text-center py-12 text-gray-500",children:"宛先を選択するとプレビューが表示されます"})})]})})]})}),(0,b.jsx)(x,{isOpen:X,title:"メールを送信しますか？",message:(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"mb-2",children:"以下の内容でメールを送信します。"}),(0,b.jsxs)("div",{className:"bg-gray-50 rounded-lg p-3 text-sm space-y-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"text-gray-500",children:"宛先:"})," ",r.length,"人"]}),(0,b.jsxs)("div",{className:"truncate",children:[(0,b.jsx)("span",{className:"text-gray-500",children:"件名:"})," ",B]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"text-gray-500",children:"送信:"})," ","immediate"===J?"即時":`${L} ${N}`]})]})]}),onConfirm:ai,onCancel:()=>Y(!1),confirmText:"はい、送信する",cancelText:"いいえ",isLoading:ab}),(0,b.jsx)(x,{isOpen:Z,title:"下書きを保存しますか？",message:(0,b.jsxs)("div",{children:[(0,b.jsx)("p",{className:"mb-2",children:"このメールを下書きとして保存します。"}),(0,b.jsxs)("div",{className:"bg-gray-50 rounded-lg p-3 text-sm space-y-1",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("span",{className:"text-gray-500",children:"宛先:"})," ",r.length,"人"]}),(0,b.jsxs)("div",{className:"truncate",children:[(0,b.jsx)("span",{className:"text-gray-500",children:"件名:"})," ",B||"(未設定)"]})]}),(0,b.jsx)("p",{className:"text-xs text-gray-500 mt-2",children:"保存した下書きは「メール管理」画面から確認・編集できます。"})]}),onConfirm:aj,onCancel:()=>$(!1),confirmText:"はい、保存する",cancelText:"いいえ",isLoading:ad}),(0,b.jsx)(y,{isOpen:_.isOpen,title:_.title,message:_.message,onClose:()=>{let a=_.nextAction;aa({isOpen:!1,title:"",message:"",nextAction:"users"}),"emails"===a?p.push("/admin/email"):p.push("/admin/users")},buttonText:"メール管理へ"})]})}function C(){return(0,b.jsx)(c.Suspense,{fallback:(0,b.jsx)("div",{className:"min-h-screen bg-gray-50 flex items-center justify-center",children:(0,b.jsx)(m.Loader2,{className:"w-8 h-8 animate-spin text-blue-500"})}),children:(0,b.jsx)(B,{})})}a.s(["default",()=>C],51463)}];

//# sourceMappingURL=app_admin_email_compose_page_tsx_7fafbee1._.js.map