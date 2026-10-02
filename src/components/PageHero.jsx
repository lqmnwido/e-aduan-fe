/** blue strip w/ the page title in it */
export default function PageHero({ title, subtitle }) {
  return (
    <section className="page-hero">
      <div className="container">
        <h1 className="page-hero__title">{title}</h1>
        {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
      </div>
    </section>
  )
}
