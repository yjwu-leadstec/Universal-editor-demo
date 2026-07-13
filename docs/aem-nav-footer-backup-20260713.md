# AEM nav/footer content backup — 2026-07-13

Environment: `leadstec-dev`

The AEM version API returned a server error for both pages, so the content values changed by this task are recorded here as a manual rollback point.

## Header

- Page: `/content/demo-site/nav`
- Brand component: `/content/demo-site/nav/jcr:content/root/section/link`
  - `sling:resourceType`: `core/franklin/components/button/v1/button`
  - `type`: `primary`
  - `text`: `AEM`
  - `href`: `#`
  - `link`: `/content/demo-site/index`
  - `linkText`: `Leadstec`
- Navigation component: `/content/demo-site/nav/jcr:content/root/section_0/text`

```html
<ul>
 <li>Products
  <ul>
   <li><a href="https://www.leads-technologies.com/en/products/adobe-experience-cloud/adobe-experience-manager/">AEM Sites</a></li>
   <li><a href="https://www.leads-technologies.com/en/products/adobe-experience-cloud/aem-assets/">AEM Assets</a></li>
   <li><a href="https://www.leads-technologies.com/en/products/adobe-experience-cloud/aem-forms/">AEM Forms</a></li>
  </ul></li>
 <li>Services
  <ul>
   <li><a href="https://www.leads-technologies.com/en/services/uxui-design/">UX/UI Design</a></li>
   <li><a href="https://www.leads-technologies.com/en/services/custom-software-development-services/">Custom Software Development</a></li>
   <li><a href="https://www.leads-technologies.com/en/services/mobile-app-design-and-development-services/">Mobile APP Design and Development</a></li>
  </ul></li>
 <li>Successful Cases</li>
 <li>About Us</li>
 <li>Blogs</li>
</ul>
```

- Tools component: `/content/demo-site/nav/jcr:content/root/section_1/text`
  - `text`: `<p>:search:</p>`

## Footer

- Page: `/content/demo-site/footer`
- Component: `/content/demo-site/footer/jcr:content/root/section/text`
  - `sling:resourceType`: `core/franklin/components/text/v1/text`
  - `text`: `<p>Copyright © 2021 Adobe. All rights reserved.</p>`
