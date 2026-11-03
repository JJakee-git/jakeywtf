import {renderContact} from './contact-template.mjs';
import {renderGallery} from '../src/gallery-template.mjs';
import {renderOrigins,renderProjectDetails} from '../src/reference-template.mjs';
import {renderScrollTests} from './scroll-tests-template.mjs';
import {renderCaseStudy} from '../src/case-study-template.mjs';
export function renderSitePages({site,projects,galleryScene,references,esc,img}){
 const links=[['./','HOME'],['aboutme/','ME'],['projects/','WORK'],['contact/','CONTACT'],...(site.showScrollTests?[['test/','TEST']]:[])];
 function layout(title,body,depth=0,bodyClass='',scrollMode='spring',projectCollection='projects'){
  const base='../'.repeat(depth)||'./';
  const backButton=bodyClass==='page-project'?`<a class="project-back-button" href="${projectCollection}/" aria-label="${projectCollection==='testprojects'?'Back to test projects':'Back to projects'}"><span class="project-back-icon" aria-hidden="true"></span><span>BACK</span></a>`:'';
  const header=`<header class="site-header"><a class="logo" href="./" aria-label="Jacob Spierer home">${img('assets/branding/logo.png','JS','',false)}</a><div class="navigation-shell"><nav id="navigation" aria-label="Main navigation" aria-hidden="true" inert hidden><div class="navigation-links">${links.map(([url,label])=>`<a class="text-link" href="${url}">${label}</a>`).join('')}</div></nav><button class="menu-toggle" aria-expanded="false" aria-controls="navigation">MENU</button>${backButton}</div></header>`;
  return `<!doctype html><html lang="en" class="${['contact-body','page-project','page-tests'].includes(bodyClass)?'continuous-scroll':''}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${base}"><title>${esc(title)} — Jacob Spierer</title><meta name="description" content="${esc(site.description)}"><meta name="theme-color" content="#000000"><link rel="icon" href="assets/branding/logo.png"><link rel="preload" href="assets/fonts/brutalisme-bold.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="assets/fonts/helvetica-neue-regular.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="styles.css"><script type="module" src="app.js"></script></head><body class="snap-site ${bodyClass}" id="top"><a class="skip-link" href="#main">Skip to content</a>${header}<main id="main" data-scroll-mode="${scrollMode}">${body}</main></body></html>`;
 }
 function footer(){return `<footer class="contact-footer snap-panel"><div class="contact-word">${img('assets/branding/crown.png','','crown')}<a class="display-heading" href="contact/"><span class="contact-label">CONTACT ME</span></a></div><div class="footer-line"><span>© ${new Date().getFullYear()} JACOB SPIERER</span><a class="text-link" href="#top">BACK TO TOP</a></div></footer>`;}
 const gallery=full=>renderGallery({full,projects,scene:galleryScene,img,esc});
 const experience=`<section class="experience snap-panel"><div class="experience-border" aria-hidden="true"></div>${img('assets/branding/experience-key.svg','','key-art')}<div class="experience-meta"><span>CHAPMAN UNIV. 2026</span><span>PSYCHOLOGY</span><span>GRAPHIC DESIGN</span></div><h2 class="display-heading experience-title">EXPERIENCE</h2><div class="experience-rule" aria-hidden="true"></div><div class="experience-bottom">${site.resume?`<a class="outline-button" href="${esc(site.resume)}">RÉSUMÉ</a>`:'<span class="resume-pending">RÉSUMÉ</span>'}</div></section>`;
 const hero=`<section class="hero snap-panel"><div class="hero-portrait" aria-hidden="true">${img('assets/branding/hunched-portrait.png','','portrait',false)}</div><div class="hero-ball" aria-hidden="true"></div><div class="hero-line" aria-hidden="true"></div><div class="hero-copy"><h1 class="display-heading"><a href="aboutme/">JACOB SPIERER</a></h1></div><p class="hero-description">${esc(site.description)}</p></section>`;
 const homeBody=hero+gallery()+experience+footer();
 const pages=[['index.html',layout('Home',homeBody,0,'page-home')],['projects/index.html',layout('Work',gallery(true),1,'page-work')]];
 const testProjects=projects.filter(p=>p.collection==='testprojects');
 const projectIndex=`<section class="project-index" aria-labelledby="project-index-heading"><h1 id="project-index-heading">TEST PROJECTS</h1><p>Select a project to preview.</p><ul class="project-index-list">${testProjects.map(p=>`<li><a href="testprojects/${p.slug}/">${img(p.preview,p.title)}<div><h2>${esc(p.title)}</h2><span class="project-index-category">${esc(p.category)}</span></div></a></li>`).join('')}</ul></section>`;
 pages.push(['testprojects/index.html',layout('Test projects',projectIndex,1,'page-tests')]);
 if(site.showScrollTests)pages.push(...renderScrollTests({layout,homeBody,esc}));
 const words=references.cycling;
 const about=`<section class="about-intro snap-panel"><div class="mission-copy"><p class="eyebrow">[ the mission ]</p><h2>provide bold, paramount work that sets a new standard, empowering individuals to take control of the narrative.</h2></div><p class="mission">providing a voice to those who care about their branding impact.</p></section><section class="bold-section snap-panel"><p>[ people call me ]</p><div class="word-window" data-word-cycle><div class="word-track">${[...words,words[0]].map(word=>`<h2 class="display-heading">${esc(word)}</h2>`).join('')}</div></div></section>`+renderOrigins(references.pages.aboutOrigins,{esc,img})+footer();
 pages.push(['aboutme/index.html',layout('About me',about,1,'page-about')]);
 const field=(name,label,type='text',placeholder='',required=true)=>{
  const validation=type==='email'?'pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]+" title="Enter an email address such as name@example.com."':type==='tel'?'inputmode="tel" pattern="(?=(?:\\D*\\d){7,15}\\D*$)\\+?[0-9\\s\\(\\)\\.\\-]+" maxlength="30" title="Enter 7–15 digits. Spaces, parentheses, hyphens, and a leading + are allowed."':'';
  const validated=['email','tel'].includes(type);
  return `<label>${label}<input name="${name}" type="${type}" placeholder="${placeholder}" ${required?'required':''} ${validation} ${validated?`aria-describedby="${name}-error" data-validate-contact`:''} autocomplete="${({firstName:'given-name',lastName:'family-name',company:'organization',email:'email',phone:'tel'})[name]||'off'}">${validated?`<span class="field-error" id="${name}-error" aria-live="polite" hidden></span>`:''}</label>`;
 };
 const configured=Boolean(site.formEndpoint||site.email);
 const contact=renderContact({site,field,esc,configured});
 pages.push(['contact/index.html',layout('Contact',contact,1,'contact-body')]);
 for(const p of projects){
  const ref=references.pages[p.slug];
  const content=ref?renderProjectDetails(ref,p,{esc,img}):p.caseStudy?renderCaseStudy(p,{esc,img}):[...new Set([p.hero,...p.images])].map((path,index)=>`<section class="project-extra-art" aria-label="${esc(p.title)} artwork" ${index===0?'data-project-start':''}>${img(path,p.title,'',false)}</section>`).join('');
  const body=`<section class="project-intro snap-panel"><h1>${esc(p.title.toUpperCase())}</h1><p>${esc(p.subtitle.toUpperCase())}</p></section>`+content+footer();
  const collection=p.collection==='testprojects'?'testprojects':'projects';
  pages.push([`${collection}/${p.slug}/index.html`,layout(p.title,body,2,'page-project','spring',collection)]);
 }
 return pages;
}
