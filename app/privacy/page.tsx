import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — ReDiagram",
  description:
    "ReDiagram's privacy policy. Learn how we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <header className="site-header">
        <div className="site-container site-header-inner">
          <Link href="/" className="brand-lockup" aria-label="ReDiagram">
            <span className="brand-mark">R</span>
            <span className="brand-text">ReDiagram</span>
          </Link>
          <div className="site-header-actions">
            <Link href="/editor" className="button button-primary button-sm">
              <span className="lang-en">Try Fix</span>
              <span className="lang-zh">体验 Fix</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="site-container">
        <div className="legal-layout">
          <nav className="legal-toc" aria-label="Table of contents">
            <p className="legal-toc-title">Contents</p>
            <ul>
              <li><a href="#collect">What we collect</a></li>
              <li><a href="#use">How we use it</a></li>
              <li><a href="#share">What we share</a></li>
              <li><a href="#cookies">Cookies</a></li>
              <li><a href="#rights">Your rights</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>

          <article className="legal-content">
            <p className="legal-updated">
              <span className="lang-en">Last updated: April 25, 2026</span>
              <span className="lang-zh">最后更新：2026年4月25日</span>
            </p>

            <section id="collect">
              <h2>
                <span className="lang-en">What we collect</span>
                <span className="lang-zh">我们收集什么</span>
              </h2>
              <p>
                <span className="lang-en">
                  ReDiagram is an image composition tool. When you use it, you upload images to our servers for processing. We do not permanently store your uploaded images beyond the processing session — they are deleted after the composition is complete and delivered.
                </span>
                <span className="lang-zh">
                  ReDiagram 是一个图像合成工具。您在使用时会将图片上传到我们的服务器进行处理。我们不会在处理会话结束后永久存储您上传的图片——它们在合成完成并交付后即被删除。
                </span>
              </p>
              <p>
                <span className="lang-en">
                  We may collect: your email address (if you sign up for early access or a waitlist), usage data such as feature usage patterns and session duration, and technical data such as browser type and IP address collected automatically by our hosting provider.
                </span>
                <span className="lang-zh">
                  我们可能收集：您的电子邮件地址（如果您注册抢先体验或候补名单）、使用数据（如功能使用情况和会话时长），以及由托管服务提供商自动收集的技术数据（如浏览器类型和 IP 地址）。
                </span>
              </p>
            </section>

            <section id="use">
              <h2>
                <span className="lang-en">How we use it</span>
                <span className="lang-zh">我们如何使用</span>
              </h2>
              <p>
                <span className="lang-en">
                  We use your email to communicate about your account, credits, and product updates. Usage and technical data help us improve the product, fix bugs, and understand how ReDiagram is used. We do not use your images to train machine learning models.
                </span>
                <span className="lang-zh">
                  我们使用您的电子邮件地址来沟通您的账户、积分和产品更新。使用数据和技术数据帮助我们改进产品、修复错误并了解 ReDiagram 的使用情况。我们不会使用您的图像来训练机器学习模型。
                </span>
              </p>
            </section>

            <section id="share">
              <h2>
                <span className="lang-en">What we share</span>
                <span className="lang-zh">我们分享什么</span>
              </h2>
              <p>
                <span className="lang-en">
                  We do not sell your personal data. We may share data with third-party service providers who host our infrastructure (e.g., cloud computing and storage providers) under strict data processing agreements. We will disclose data if required by law.
                </span>
                <span className="lang-zh">
                  我们不出售您的个人数据。我们可能在严格的数据处理协议下与托管基础设施的第三方服务提供商（如云计算和存储提供商）共享数据。如法律要求，我们将披露数据。
                </span>
              </p>
            </section>

            <section id="cookies">
              <h2>
                <span className="lang-en">Cookies</span>
                <span className="lang-zh">Cookie</span>
              </h2>
              <p>
                <span className="lang-en">
                  We use minimal cookies: a session cookie to keep you logged in, and an analytics cookie to understand aggregate traffic. You can disable cookies in your browser — the site will still function, though some preferences may not persist.
                </span>
                <span className="lang-zh">
                  我们使用最少的 Cookie：一个会话 Cookie 用于保持登录状态，一个分析 Cookie 用于了解总体流量。您可以在浏览器中禁用 Cookie——网站仍可正常运行，但某些偏好设置可能无法保留。
                </span>
              </p>
            </section>

            <section id="rights">
              <h2>
                <span className="lang-en">Your rights</span>
                <span className="lang-zh">您的权利</span>
              </h2>
              <p>
                <span className="lang-en">
                  Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. To exercise these rights, email us at{" "}
                </span>
                <span className="lang-zh">
                  根据您所在司法管辖区的不同，您可能有权访问、更正或删除您的个人数据。行使这些权利，请发送电子邮件至{" "}
                </span>
                <a href="mailto:hello@rediagram.com">hello@rediagram.com</a>.
              </p>
            </section>

            <section id="contact">
              <h2>
                <span className="lang-en">Contact</span>
                <span className="lang-zh">联系我们</span>
              </h2>
              <p>
                <span className="lang-en">ReDiagram</span>
                <span className="lang-zh">ReDiagram</span>
                <br />
                Email: <a href="mailto:hello@rediagram.com">hello@rediagram.com</a>
              </p>
            </section>
          </article>
        </div>
      </div>
    </main>
  )
}
