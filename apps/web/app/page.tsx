import Link from 'next/link';
import { CarNoteCalculator } from './car-note-calculator';

export default function HomePage() {
  return (
    <div>
      <h1 className="large-title">Your idle car can pay for itself.</h1>
      <p className="subtle" style={{ fontSize: 18 }}>
        List your car for vetted, trust-scored rideshare drivers. No fees, no subscriptions — we
        only earn a share when your car earns.
      </p>
      <div className="btn-row" style={{ marginTop: 20 }}>
        <Link href="/owner" className="btn btn-block">
          List my car
        </Link>
      </div>

      <p className="eyebrow">Try it</p>
      <CarNoteCalculator />

      <p className="eyebrow">How it works</p>
      <section className="card">
        <ol className="steps">
          <li>
            <div>
              <strong>List your car</strong>
              <p className="subtle">Add the VIN, plate and tier. It takes about two minutes.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Drivers are vetted and scored</strong>
              <p className="subtle">
                Background-checked drivers earn access to nicer cars only as their Trust Score
                grows.
              </p>
            </div>
          </li>
          <li>
            <div>
              <strong>Get paid per trip</strong>
              <p className="subtle">
                Every booking is insured before it is confirmed. You earn a share of every completed
                trip.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
