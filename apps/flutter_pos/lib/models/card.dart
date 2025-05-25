class CardModel {
  final String id;
  final String uid;
  final String customerId;
  final String issuingMerchantId;

  CardModel({
    required this.id,
    required this.uid,
    required this.customerId,
    required this.issuingMerchantId,
  });

  factory CardModel.fromJson(Map<String, dynamic> json) {
    return CardModel(
      id: json['id'],
      uid: json['uid'],
      customerId: json['customer_id'],
      issuingMerchantId: json['issuing_merchant_id'],
    );
  }
} 