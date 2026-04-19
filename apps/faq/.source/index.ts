// @ts-nocheck -- skip type checking
import * as d_legal_2 from "../src/mdx/legal/terms.mdx?collection=legal"
import * as d_legal_1 from "../src/mdx/legal/privacy.mdx?collection=legal"
import * as d_legal_0 from "../src/mdx/legal/index.mdx?collection=legal"
import * as d_blog_3 from "../src/mdx/blog/readme.mdx?collection=blog"
import * as d_blog_2 from "../src/mdx/blog/ioc.mdx?collection=blog"
import * as d_blog_1 from "../src/mdx/blog/index.mdx?collection=blog"
import * as d_blog_0 from "../src/mdx/blog/async-architecture.mdx?collection=blog"
import { _runtime } from "fumadocs-mdx/runtime/next"
import * as _source from "../source.config"
export const blog = _runtime.docs<typeof _source.blog>([{ info: {"path":"async-architecture.mdx","fullPath":"src/mdx/blog/async-architecture.mdx"}, data: d_blog_0 }, { info: {"path":"index.mdx","fullPath":"src/mdx/blog/index.mdx"}, data: d_blog_1 }, { info: {"path":"ioc.mdx","fullPath":"src/mdx/blog/ioc.mdx"}, data: d_blog_2 }, { info: {"path":"readme.mdx","fullPath":"src/mdx/blog/readme.mdx"}, data: d_blog_3 }], [{"info":{"path":"meta.json","fullPath":"src/mdx/blog/meta.json"},"data":{"pages":["index","...","!ioc"]}}])
export const legal = _runtime.docs<typeof _source.legal>([{ info: {"path":"index.mdx","fullPath":"src/mdx/legal/index.mdx"}, data: d_legal_0 }, { info: {"path":"privacy.mdx","fullPath":"src/mdx/legal/privacy.mdx"}, data: d_legal_1 }, { info: {"path":"terms.mdx","fullPath":"src/mdx/legal/terms.mdx"}, data: d_legal_2 }], [{"info":{"path":"meta.json","fullPath":"src/mdx/legal/meta.json"},"data":{"pages":["index","terms","privacy"]}}])