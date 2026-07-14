from flask import Blueprint, request, jsonify, current_app
from services.points_service import add_points, get_balance
import stripe
import os

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/<int:user_id>/points', methods=['GET'])
def user_points(user_id):
    balance = get_balance(user_id)
    return jsonify({'balance': balance})

@user_bp.route('/stripe-webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    # Webhook Secret को Config से लें
    endpoint_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        # यहाँ Stripe सिग्नेचर वेरिफाई होता है (यह सुनिश्चित करता है कि request असली Stripe से आई है)
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        # Invalid payload
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return 'Invalid signature', 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # हमने Checkout Session बनाते समय metadata में user_id और points डाले थे
        user_id = int(session['metadata']['user_id'])
        points = int(session['metadata']['points'])
        plan_name = session['metadata']['plan']
        
        # अब Points Service का उपयोग करके user के खाते में points जोड़ें
        try:
            add_points(
                user_id=user_id,
                amount=points,
                description=f'Recharged {plan_name} (Stripe Payment)',
                txn_type='recharge'
            )
            print(f"[OK] Successfully added {points} points to user {user_id}")
        except Exception as e:
            print(f"[ERROR] Failed to add points: {e}")
            return 'Internal error', 500

    # Stripe को बताएँ कि Webhook सफलतापूर्वक प्राप्त हो गया
    return '', 200