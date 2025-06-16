class Customer {
  final String id;
  final String? email;
  final String merchantId;

  Customer({
    required this.id,
    this.email,
    required this.merchantId,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      email: json['email'],
      merchantId: json['merchant_id'],
    );
  }
} 