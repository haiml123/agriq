import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ComponentShowcase() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Component Showcase
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Light & Dark Mode Support
                    </p>
                </div>

                {/* Buttons Section */}
                <section className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                        Buttons
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button>Danger</Button>
                        <Button>Loading</Button>
                        <Button disabled>Disabled</Button>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Sizes
                        </h3>
                        <div className="flex flex-wrap gap-3 items-center">
                            <Button  size="sm">Small</Button>
                            <Button  size="sm">Medium</Button>
                            <Button  size="lg">Large</Button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Button fullWidth>Full Width Button</Button>
                    </div>
                </section>

                {/* Inputs Section */}
                <section className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                        Input Fields
                    </h2>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <Input type="email" placeholder="you@example.com" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <Input type="password" placeholder="••••••••" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                With Error
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter value"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Disabled
                            </label>
                            <Input type="text" placeholder="Disabled field" disabled />
                        </div>
                    </div>
                </section>

                {/* Status Badges Section */}
                <section className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                        Status Badges
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <span className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-full">
                            Low
                        </span>
                        <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                            Medium
                        </span>
                        <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                            High
                        </span>
                        <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                            Critical
                        </span>
                    </div>
                </section>

                {/* Card Example */}
                <section className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                        Card with Content
                    </h2>
                    <div className="space-y-3">
                        <div className="p-4 bg-surface-secondary rounded-lg">
                            <h3 className="font-medium text-foreground mb-1">
                                Alert Title
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This is some descriptive text that appears in a card. It adapts to both light and dark modes seamlessly.
                            </p>
                        </div>
                        <div className="p-4 bg-surface-secondary rounded-lg hover:bg-border transition-colors cursor-pointer">
                            <h3 className="font-medium text-foreground mb-1">
                                Hoverable Card
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Hover over this card to see the effect in both modes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Table Example */}
                <section className="bg-surface border border-border rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-semibold text-foreground">
                            Data Table
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-secondary">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                            <tr className="hover:bg-surface-secondary">
                                <td className="px-6 py-4 text-foreground">
                                    Item One
                                </td>
                                <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded">
                                            Active
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                    2025-11-24
                                </td>
                            </tr>
                            <tr className="hover:bg-surface-secondary">
                                <td className="px-6 py-4 text-foreground">
                                    Item Two
                                </td>
                                <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                                            Warning
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                    2025-11-23
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}