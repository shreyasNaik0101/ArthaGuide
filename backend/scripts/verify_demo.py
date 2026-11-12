"""HTTP smoke test. Optional flags use REAL configured providers, never fixtures as responses."""
import argparse
import sys
import httpx


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:8000/api/freelancer')
    parser.add_argument('--ai', action='store_true', help='Call live extraction and explanation (uses API credits)')
    parser.add_argument('--paypal', action='store_true', help='Retrieve the stored invoice from PayPal; pay it in the browser first')
    args = parser.parse_args()
    with httpx.Client(base_url=args.base_url.rstrip('/') + '/', timeout=150) as client:
        def call(path, payload=None):
            response = client.get(path) if payload is None else client.post(path, json=payload)
            if not response.is_success:
                raise RuntimeError(f'{path}: HTTP {response.status_code}: {response.text}')
            return response.json()
        bootstrap = call('bootstrap')
        print('PayPal configuration:', bootstrap['paypal_config'])
        print('Live AI configured:', bootstrap['ai_configured'])
        paid = bootstrap['paypal']['verified']
        for late in (False, True):
            r = call('calculate', {'late': late})
            assert r['gap_minor'] == (600000 if paid else 1800000), r
            if late and not paid:
                assert r['offers'][0]['repayment_shortfall']['shortfall_minor'] == 360000
                assert r['offers'][0]['repayment_shortfall']['date'] == '2026-11-27'
                assert r['offers'][0]['lowest_balance_minor'] == -510000
                assert r['offers'][1]['lowest_balance_minor'] == 200000
            print('PASS calculator', 'late' if late else 'expected', 'gap paise:', r['gap_minor'], 'recommendation:', r['recommended'])
        if args.ai:
            if not bootstrap['ai_configured']:
                raise RuntimeError('Missing OPENAI_API_KEY in backend/.env; restart the backend after configuring it.')
            intake = call('extract', {'client_messages': bootstrap['client_messages'], 'loan_offers': bootstrap['loan_offers']})
            assert not intake['errors'], intake['errors']
            assert intake['extraction']['revised_payment_date']['value'] == '2026-11-24'
            assert intake['extraction']['original_payment_date']['value'] == '2026-11-21'
            assert 'supersedes' in intake['extraction']['superseding_message']['source']
            for n, fee in enumerate((120000, 240000)):
                assert intake['extraction']['offers'][n]['fee']['value_minor'] == fee
            compared = call('calculate', {'late': True, 'review_id': intake['review_id']})
            explanation = call('explain', {'late': True, 'review_id': intake['review_id'], 'language': 'en'})
            assert explanation['calculator_results'] == compared
            print('PASS LIVE extraction:', intake['provider'], intake['model'])
            print('LIVE explanation:', explanation['explanation'])
        if args.paypal:
            if not all(bootstrap['paypal_config'].values()):
                raise RuntimeError('Missing sandbox app credentials or PAYPAL_BUYER_EMAIL in backend/.env.')
            if not bootstrap['paypal']['invoice_id']:
                raise RuntimeError('Review and issue the $160 USD invoice in the adviser, open the hosted payer link, and pay as the sandbox personal buyer.')
            for _ in range(3):
                payment = call('invoice/check', {})
                if not payment['verified']:
                    raise RuntimeError('PayPal status is ' + payment['status'] + '; no verified $160 USD payment yet. Gap must stay INR 18,000.')
                r = call('calculate', {'availability_date': '2026-11-16'})
                assert r['gap_minor'] == 600000
                assert r['outstanding_project_usd_minor'] == 24000
            later = call('calculate', {'availability_date': '2026-11-17'})
            assert later['gap_minor'] == 1800000
            print('PASS REAL sandbox payment and three repeated checks:', payment['invoice_id'], payment['payment_id'])
            print('PASS later funds availability leaves repair-date gap INR 18,000')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (RuntimeError, AssertionError, httpx.HTTPError) as error:
        print('NOT VERIFIED:', error)
        sys.exit(1)
