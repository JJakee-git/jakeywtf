export const scrollTests=[
 {slug:'elastic',name:'Rubber band',description:'A small scroll stretches the page and springs back. A longer gesture takes you to the next section.'},
 {slug:'spring',name:'Soft spring',description:'Lighter resistance, then a soft bounce as the next section lands.'},
 {slug:'momentum',name:'Momentum',description:'The page follows your scrolling with inertia, then settles onto the closest section.'},
 {slug:'magnetic',name:'Magnetic settle',description:'Pull farther into the next section. When you stop, it gently settles forward or returns.'}
];

export function renderScrollTests({layout,homeBody,esc}){
 const hub=`<section class="scroll-test-index"><p class="eyebrow">[ SCROLL TESTS ]</p><h1>FIND THE FEEL.</h1><p>Try a small scroll, a longer gesture, and a change in direction. Each version uses the same homepage so you can compare the movement.</p><nav aria-label="Scroll versions">${scrollTests.map((test,i)=>`<a href="test/${test.slug}/"><span class="test-number">0${i+1}</span><div><h2>${esc(test.name)}</h2><p>${esc(test.description)}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</nav></section>`;
 const pages=[['test/index.html',layout('Scroll tests',hub,1,'page-tests')]];
 scrollTests.forEach((test,i)=>{
  const next=scrollTests[(i+1)%scrollTests.length];
  const toolbar=`<aside class="scroll-test-toolbar" aria-label="Scroll test navigation"><a href="test/">← ALL TESTS</a><span>0${i+1} · ${esc(test.name.toUpperCase())}</span><a href="test/${next.slug}/">NEXT VERSION →</a></aside>`;
  pages.push([`test/${test.slug}/index.html`,layout(test.name+' scroll test',toolbar+homeBody,2,'page-home page-scroll-test',test.slug)]);
 });
 return pages;
}
