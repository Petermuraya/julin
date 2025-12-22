import { createClient } from '@supabase/supabase-js';

// Read Supabase config from environment. This script should be executed
// in a secure environment (CI or local dev) where env vars are provided.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. Aborting.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createBlogPost() {
  try {
    // First try to create the table (this might fail if it already exists, but that's ok)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.blogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image TEXT,
        author_name TEXT,
        published BOOLEAN DEFAULT false,
        published_at TIMESTAMP WITH TIME ZONE,
        tags TEXT[],
        seo_title TEXT,
        seo_description TEXT,
        seo_keywords TEXT[],
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Anyone can read published blogs"
      ON public.blogs
      FOR SELECT
      USING (published = true);
    `;

    console.log('Attempting to create blogs table...');

    // Try to execute the table creation
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.log('Table creation error (might already exist):', createError.message);
    } else {
      console.log('Blogs table created successfully');
    }

    // Now insert the blog post
    const blogContent = `Introduction

Land ownership and real estate development are central to Kenya's economic growth. However, the sector is one of the most legally sensitive areas due to historical land injustices, fraud, overlapping laws, and administrative inefficiencies. Whether you are purchasing land, developing property, or investing in real estate, awareness of the legal landscape is critical.

This article explores the most common legal issues affecting land and real estate in Kenya and offers practical guidance on how to navigate them.

1. Land Ownership and Title Deeds

One of the most common legal issues in Kenya is uncertainty over land ownership. Many disputes arise from:

Fake or forged title deeds

Multiple titles issued for the same parcel of land

Incomplete succession processes for inherited land

Historical land injustices

Before acquiring land, it is essential to conduct an official land search at the Ministry of Lands to confirm ownership, encumbrances, and land status.

2. Land Fraud and Scams

Land fraud remains a major concern in Kenya's real estate sector. Common scams include:

Selling land without legal authority

Impersonation of landowners

Sale of public or government land

Double sale of the same property

Engaging a qualified advocate, conducting due diligence, and verifying documents can significantly reduce the risk of fraud.

3. Land Use and Zoning Regulations

Kenya has strict land use and zoning regulations governed by county governments and physical planning laws. Legal issues often arise when:

Property is used contrary to its approved purpose

Developments lack planning approval

Environmental impact assessments are ignored

Failure to comply may lead to penalties, demolition orders, or denial of occupancy certificates.

4. Leasehold vs Freehold Land

Land in Kenya is held under either freehold or leasehold tenure. Leasehold land, often issued for 33, 50, or 99 years, requires renewal upon expiry. Legal challenges may occur if:

Lease renewal applications are delayed or rejected

Conditions of the lease are breached

Ground rent and land rates are unpaid

Property owners should monitor lease terms closely to avoid loss of rights.

5. Succession and Inheritance Disputes

Real estate disputes frequently arise after the death of a landowner, especially where no will exists. Issues include:

Unauthorized sale of inherited property

Family disputes over land distribution

Delays in succession proceedings

Under Kenyan law, property of a deceased person can only be transferred through a lawful succession process.

6. Property Taxes, Rates, and Charges

Landowners are legally required to pay land rates, rent, and other statutory charges. Failure to comply may result in:

Accumulation of penalties and interest

Restrictions on property transfers

Auction of property by county governments

Regular compliance ensures smooth transactions and protects ownership rights.

7. Dispute Resolution in Land Matters

Land and real estate disputes are handled by the Environment and Land Court (ELC) in Kenya. Alternative dispute resolution methods such as mediation and arbitration are also encouraged to reduce costs and delays.

Early legal advice can help resolve disputes efficiently and prevent prolonged litigation.

Conclusion

Land and real estate transactions in Kenya require careful legal consideration. From verifying ownership to complying with planning laws and tax obligations, understanding the legal framework is essential for protecting investments. Engaging qualified professionals and conducting thorough due diligence can help avoid costly mistakes.

If you are planning to buy, sell, or invest in land or real estate in Kenya, seeking legal guidance is not just advisable—it is necessary.`;

    const { data, error } = await supabase
      .from('blogs')
      .insert({
        title: 'Legal Issues in Kenya Land and Real Estate: A Comprehensive Guide',
        slug: 'legal-issues-kenya-land-real-estate-guide',
        excerpt: 'Land ownership and real estate development are central to Kenya\'s economic growth. However, the sector is one of the most legally sensitive areas due to historical land injustices, fraud, overlapping laws, and administrative inefficiencies.',
        content: blogContent,
        author_name: 'Julius Murigi',
        published: true,
        published_at: new Date().toISOString(),
        tags: ['Kenya', 'Real Estate', 'Legal Issues', 'Land Ownership', 'Property Law'],
        seo_title: 'Legal Issues in Kenya Land and Real Estate: Complete Guide 2025',
        seo_description: 'Comprehensive guide to legal issues affecting land and real estate in Kenya. Learn about title deeds, fraud prevention, zoning laws, and dispute resolution.',
        seo_keywords: ['Kenya land law', 'real estate legal issues', 'property ownership Kenya', 'land fraud prevention', 'Kenya property taxes']
      });

    if (error) {
      console.error('Error inserting blog:', error);
    } else {
      console.log('Blog post created successfully:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

createBlogPost();