          Container(
            width: 360,
            height: 360,
            decoration: BoxDecoration(
              color: page.color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Image.asset(
                page.image,
                width: 280,
                height: 280,
                fit: BoxFit.contain,
              ),
            ),
          ), 