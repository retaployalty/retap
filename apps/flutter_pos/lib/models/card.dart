class CardModel {
  final String id;
  final String uid;
  final String customerId;
  final String issuingMerchantId;
  final List<Map<String, dynamic>> balances;

  CardModel({
    required this.id,
    required this.uid,
    required this.customerId,
    required this.issuingMerchantId,
    this.balances = const [],
  });

  factory CardModel.fromJson(Map<String, dynamic> json) {
    return CardModel(
      id: json['id'] as String,
      uid: json['uid'] as String,
      customerId: json['customer_id'] as String,
      issuingMerchantId: json['issuing_merchant_id'] as String,
      balances: (json['balances'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'uid': uid,
      'customer_id': customerId,
      'issuing_merchant_id': issuingMerchantId,
      'balances': balances,
    };
  }
} 