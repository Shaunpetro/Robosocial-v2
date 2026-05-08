export async function GET(request: NextRequest) {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        licenseId: true,
        license: { select: { customerName: true } },
        createdAt: true,
      },
    });
  
    return NextResponse.json(users);
  }