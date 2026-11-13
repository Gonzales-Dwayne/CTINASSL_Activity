import './CategoryCard.css'

function CategoryCard({ name, blurb, color }) {
  return (
    <article className="card">
      <div className="card__thumb" style={{ '--accent': color }}>
        <span className="card__thumb-label">Image</span>
      </div>

      <div className="card__body">
        <h3 className="card__title">{name}</h3>
        <p className="card__copy">{blurb}</p>
        <a className="card__link" href="#top">
          Browse
          <span aria-hidden="true"> →</span>
        </a>
      </div>
    </article>
  )
}

export default CategoryCard
