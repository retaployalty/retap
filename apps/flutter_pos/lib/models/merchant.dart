class Merchant {
  final String id;
  final String name;
  final String? logoUrl;
  final String? address;

  Merchant({
    required this.id,
    required this.name,
    this.logoUrl,
    this.address,
  });

  factory Merchant.fromJson(Map<String, dynamic> json) {
    return Merchant(
      id: json['id'],
      name: json['name'],
      logoUrl: json['logo_url'],
      address: json['address'],
    );
  }
} 