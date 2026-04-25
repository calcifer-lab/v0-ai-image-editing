import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service — ReDiagram",
  description:
    "ReDiagram's terms of service. By using ReDiagram, you agree to these terms.",
}

export default function TermsPage() {
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
              <li><a href="#acceptance">Acceptance</a></li>
              <li><a href="#service">The service</a></li>
              <li><a href="#accounts">Accounts</a></li>
              <li><a href="#usage">Acceptable use</a></li>
              <li><a href="#ip">Intellectual property</a></li>
              <li><a href="#credits">Credits and billing</a></li>
              <li><a href="#disclaimer">Disclaimer</a></li>
              <li><a href="#liability">Limitation of liability</a></li>
              <li><a href="#changes">Changes to terms</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>

          <article className="legal-content">
            <p className="legal-updated">
              <span className="lang-en">Last updated: April 25, 2026</span>
              <span className="lang-zh">最后更新：2026年4月25日</span>
            </p>

            <section id="acceptance">
              <h2>
                <span className="lang-en">1. Acceptance</span>
                <span className="lang-zh">1. 接受条款</span>
              </h2>
              <p>
                <span className="lang-en">
                  By accessing or using ReDiagram (&ldquo;the service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
                </span>
                <span className="lang-zh">
                  访问或使用 ReDiagram（"服务"）即表示您同意受本服务条款的约束。如果您不同意，请不要使用本服务。
                </span>
              </p>
            </section>

            <section id="service">
              <h2>
                <span className="lang-en">2. The service</span>
                <span className="lang-zh">2. 服务说明</span>
              </h2>
              <p>
                <span className="lang-en">
                  ReDiagram provides an AI-assisted image composition tool (&ldquo;Fix&rdquo;) that lets you composite elements from one image into another. ReDiagram is provided &ldquo;as is&rdquo; and we reserve the right to modify, suspend, or discontinue any part of the service at any time.
                </span>
                <span className="lang-zh">
                  ReDiagram 提供 AI 辅助图像合成工具（"Fix"），让您可以将一个图像中的元素合成到另一个图像中。ReDiagram 按"现状"提供，我们保留随时修改、暂停或停止服务任何部分的的权利。
                </span>
              </p>
            </section>

            <section id="accounts">
              <h2>
                <span className="lang-en">3. Accounts</span>
                <span className="lang-zh">3. 账户</span>
              </h2>
              <p>
                <span className="lang-en">
                  Some features require an account. You are responsible for keeping your login credentials secure and for all activity under your account. We may suspend or delete accounts that violate these terms.
                </span>
                <span className="lang-zh">
                  部分功能需要账户。您有责任保护您的登录凭证安全，并对您账户下的所有活动负责。我们可能暂停或删除违反本条款的账户。
                </span>
              </p>
            </section>

            <section id="usage">
              <h2>
                <span className="lang-en">4. Acceptable use</span>
                <span className="lang-zh">4. 可接受使用</span>
              </h2>
              <p>
                <span className="lang-en">You agree not to use ReDiagram to:</span>
                <span className="lang-zh">您同意不将 ReDiagram 用于：</span>
              </p>
              <ul>
                <li>
                  <span className="lang-en">Generate or composite content that is illegal, harmful, or infringing</span>
                  <span className="lang-zh">生成或合成非法、有害或侵权的 content</span>
                </li>
                <li>
                  <span className="lang-en">Violate any third-party intellectual property rights</span>
                  <span className="lang-zh">侵犯任何第三方知识产权</span>
                </li>
                <li>
                  <span className="lang-en">Attempt to reverse engineer, extract models, or circumvent usage limits</span>
                  <span className="lang-zh">试图反向工程、提取模型或绕过使用限制</span>
                </li>
                <li>
                  <span className="lang-en">Use the service in a way that disrupts others</span>
                  <span className="lang-zh">以干扰他人的方式使用服务</span>
                </li>
              </ul>
            </section>

            <section id="ip">
              <h2>
                <span className="lang-en">5. Intellectual property</span>
                <span className="lang-zh">5. 知识产权</span>
              </h2>
              <p>
                <span className="lang-en">
                  You own the output you create with ReDiagram, subject to the following: the images and materials you use as patches (&ldquo;source materials&rdquo;) must be owned by you or properly licensed. You are solely responsible for ensuring you have the right to use any source material in your compositions.
                </span>
                <span className="lang-zh">
                  您拥有使用 ReDiagram 创建的输出，但须遵守以下规定：您用作补丁的图片和材料（"来源材料"）必须为您所有或已获得适当授权。您全权负责确保您有权在任何合成中使用任何来源材料。
                </span>
              </p>
              <p>
                <span className="lang-en">
                  ReDiagram and its underlying technology, including models and algorithms, are owned by ReDiagram and may not be copied, extracted, or used outside the service.
                </span>
                <span className="lang-zh">
                  ReDiagram 及其底层技术（包括模型和算法）由 ReDiagram 所有，未经许可不得复制、提取或在服务外使用。
                </span>
              </p>
            </section>

            <section id="credits">
              <h2>
                <span className="lang-en">6. Credits and billing</span>
                <span className="lang-zh">6. 积分与计费</span>
              </h2>
              <p>
                <span className="lang-en">
                  ReDiagram currently operates on a credit system. Each composition (&ldquo;fix&rdquo;) costs one credit. Credits are non-refundable unless required by law. We reserve the right to change pricing with 30 days&rsquo; notice.
                </span>
                <span className="lang-zh">
                  ReDiagram 目前采用积分制运营。每次合成（"fix"）消耗一个积分。除法律要求外，积分不可退还。我们保留提前 30 天通知更改价格的权利。
                </span>
              </p>
            </section>

            <section id="disclaimer">
              <h2>
                <span className="lang-en">7. Disclaimer</span>
                <span className="lang-zh">7. 免责声明</span>
              </h2>
              <p>
                <span className="lang-en">
                  THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT OUTPUT WILL BE ERROR-FREE, SEAMLESS, OR SUITABLE FOR ANY SPECIFIC PURPOSE. THE QUALITY OF COMPOSITION RESULTS VARIES BASED ON INPUT MATERIALS AND THE DEGREE OF STYLE MATCH BETWEEN SOURCE AND TARGET IMAGES.
                </span>
                <span className="lang-zh">
                  服务按"现状"提供，不附带任何明示或暗示保证。我们不保证输出结果无错误、无缝或适合任何特定目的。合成结果的质量因输入材料和来源与目标图像之间的风格匹配程度而异。
                </span>
              </p>
            </section>

            <section id="liability">
              <h2>
                <span className="lang-en">8. Limitation of liability</span>
                <span className="lang-zh">8. 责任限制</span>
              </h2>
              <p>
                <span className="lang-en">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, ReDiagram SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
                </span>
                <span className="lang-zh">
                  在法律允许的最大范围内，ReDiagram 对因您使用服务而引起的任何间接、偶发、特殊或后果性损害不承担责任。我们在诉讼前十二个月内收到金额为上限。
                </span>
              </p>
            </section>

            <section id="changes">
              <h2>
                <span className="lang-en">9. Changes to terms</span>
                <span className="lang-zh">9. 条款变更</span>
              </h2>
              <p>
                <span className="lang-en">
                  We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify you of material changes via email or a prominent notice on the service.
                </span>
                <span className="lang-zh">
                  我们可能不时更新这些条款。在更改后继续使用服务即表示接受新条款。我们将通过电子邮件或服务上的显著通知告知您重大更改。
                </span>
              </p>
            </section>

            <section id="contact">
              <h2>
                <span className="lang-en">10. Contact</span>
                <span className="lang-zh">10. 联系我们</span>
              </h2>
              <p>
                <span className="lang-en">Questions about these terms?</span>
                <span className="lang-zh">对这些条款有疑问？</span>
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
