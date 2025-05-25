class Reward {
  final String id;
  final String name;
  final String description;
  final String? imagePath;
  final int priceCoins;

  Reward({
    required this.id,
    required this.name,
    required this.description,
    required this.imagePath,
    required this.priceCoins,
  });

  factory Reward.fromJson(Map<String, dynamic> json) {
    return Reward(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      imagePath: json['image_path'],
      priceCoins: json['price_coins'],
    );
  }
} 